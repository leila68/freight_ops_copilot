"""
LangChain tools available to the LangGraph agent.

SQL tools  — query structured data from existing DB tables.
RAG tool   — semantic search over uploaded document chunks via pgvector.
"""
from langchain_core.tools import tool
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.models import (
    Quote, Lane, EquipmentType, Accessorial,
    User, DocumentChunk, Document,
)
from app.services.embeddings import embed_query


def make_sql_tools(db: Session, current_user: User):
    """
    Returns tool functions closed over the DB session and current user.
    Customers are automatically scoped to their own data.
    """

    @tool
    def search_quotes(
        status: str | None = None,
        origin: str | None = None,
        destination: str | None = None,
        limit: int = 10,
    ) -> str:
        """
        Search quotes in the database.
        Use this when the user asks about quotes, shipments, or orders.

        Args:
            status: Filter by quote status: pending, accepted, expired, rejected
            origin: Filter by origin city name (partial match)
            destination: Filter by destination city name (partial match)
            limit: Maximum results to return (default 10, max 25)
        """
        limit = min(limit, 25)
        query = db.query(Quote).join(Quote.lane).join(Quote.customer)

        if current_user.role == "customer":
            query = query.filter(Quote.customer_id == current_user.id)

        if status:
            query = query.filter(Quote.status == status.lower())
        if origin:
            query = query.filter(Quote.lane.has(Lane.origin_city.ilike(f"%{origin}%")))
        if destination:
            query = query.filter(Quote.lane.has(Lane.destination_city.ilike(f"%{destination}%")))

        quotes = query.order_by(desc(Quote.created_at)).limit(limit).all()

        if not quotes:
            return "No quotes found matching those criteria."

        lines = []
        for q in quotes:
            customer_info = f" | Customer: {q.customer.full_name}" if current_user.role == "staff" else ""
            lines.append(
                f"- Quote #{str(q.id)[:8]} | {q.lane.origin_city} -> {q.lane.destination_city} "
                f"| {q.equipment_type.name} | {q.total_weight} lbs "
                f"| ${q.total_price} | Status: {q.status} "
                f"| Date: {q.created_at.strftime('%Y-%m-%d')}{customer_info}"
            )
        return f"Found {len(quotes)} quote(s):\n" + "\n".join(lines)

    @tool
    def get_lane_info(
        origin_city: str,
        destination_city: str,
    ) -> str:
        """
        Get rate and distance information for a specific lane.
        Use this when the user asks about shipping costs, rates, or distances
        between two cities.

        Args:
            origin_city: The origin city name (e.g. Toronto)
            destination_city: The destination city name (e.g. Montreal)
        """
        lane = db.query(Lane).filter(
            Lane.origin_city.ilike(f"%{origin_city}%"),
            Lane.destination_city.ilike(f"%{destination_city}%"),
            Lane.is_active == True,
        ).first()

        if not lane:
            lane = db.query(Lane).filter(
                Lane.origin_city.ilike(f"%{destination_city}%"),
                Lane.destination_city.ilike(f"%{origin_city}%"),
                Lane.is_active == True,
            ).first()

        if not lane:
            return (
                f"No configured lane found between {origin_city} and {destination_city}. "
                f"Staff may need to add this lane first."
            )

        return (
            f"Lane: {lane.origin_city}, {lane.origin_province} -> "
            f"{lane.destination_city}, {lane.destination_province}\n"
            f"Base rate: ${lane.base_rate}\n"
            f"Distance: {lane.distance_km} km\n"
            f"Transit time: {lane.transit_days} day(s)"
        )

    @tool
    def get_quote_stats(group_by: str = "status") -> str:
        """
        Get aggregated statistics about quotes.
        Use this when the user asks for summaries, counts, averages, or totals.
        Examples: how many pending quotes, average quote value, total revenue.

        Args:
            group_by: What to group by: status, lane, equipment, customer
        """
        base_query = db.query(Quote)
        if current_user.role == "customer":
            base_query = base_query.filter(Quote.customer_id == current_user.id)

        total = base_query.count()
        if total == 0:
            return "No quotes found."

        avg_value = base_query.with_entities(func.avg(Quote.total_price)).scalar()
        total_value = base_query.with_entities(func.sum(Quote.total_price)).scalar()

        status_counts = (
            base_query
            .with_entities(Quote.status, func.count(Quote.id))
            .group_by(Quote.status)
            .all()
        )
        status_lines = "\n".join([f"  {s}: {c}" for s, c in status_counts])

        return (
            f"Quote statistics:\n"
            f"Total quotes: {total}\n"
            f"Average value: ${float(avg_value or 0):.2f}\n"
            f"Total value: ${float(total_value or 0):.2f}\n"
            f"By status:\n{status_lines}"
        )

    @tool
    def list_equipment_types() -> str:
        """
        List all available equipment types and their rate multipliers.
        Use this when the user asks about equipment options or trailer types.
        """
        equipment = db.query(EquipmentType).filter(
            EquipmentType.is_active == True
        ).all()

        if not equipment:
            return "No equipment types configured."

        lines = [
            f"- {e.name}: x{e.multiplier} multiplier"
            + (f" — {e.description}" if e.description else "")
            for e in equipment
        ]
        return "Available equipment types:\n" + "\n".join(lines)

    @tool
    def list_accessorials() -> str:
        """
        List all available accessorial charges.
        Use this when the user asks about extra services, additional fees,
        liftgate, appointment scheduling, or other add-on charges.
        """
        accessorials = db.query(Accessorial).filter(
            Accessorial.is_active == True
        ).all()

        if not accessorials:
            return "No accessorials configured."

        lines = []
        for a in accessorials:
            fee_str = f"${a.amount} flat fee" if a.charge_type == "flat" else f"{a.amount}% of base rate"
            lines.append(
                f"- {a.name}: {fee_str}"
                + (f" — {a.description}" if a.description else "")
            )
        return "Available accessorials:\n" + "\n".join(lines)

    return [
        search_quotes,
        get_lane_info,
        get_quote_stats,
        list_equipment_types,
        list_accessorials,
    ]


def make_rag_tool(db: Session):
    """Returns the document search tool closed over the DB session."""

    @tool
    def search_documents(query: str, limit: int = 4) -> str:
        """
        Search uploaded policy documents, carrier contracts, and rate guides
        using semantic similarity search.
        Use this when the user asks about policies, terms, contracts, procedures,
        or anything that would be found in a document rather than the database.
        Examples: detention policy, damage claims, fuel surcharge policy, carrier terms.

        Args:
            query: The search query describing what information is needed
            limit: Number of relevant chunks to retrieve (default 4)
        """
        doc_count = db.query(Document).count()
        if doc_count == 0:
            return "No documents have been uploaded yet. Staff can upload policy documents via the Documents page."

        query_vector = embed_query(query)

        chunks = (
            db.query(DocumentChunk)
            .filter(DocumentChunk.embedding.isnot(None))
            .order_by(DocumentChunk.embedding.cosine_distance(query_vector))
            .limit(limit)
            .all()
        )

        if not chunks:
            return "No relevant document content found for that query."

        results = []
        for chunk in chunks:
            doc_title = chunk.document.title if chunk.document else "Unknown document"
            results.append(f"[From: {doc_title}]\n{chunk.content}")

        return "\n\n---\n\n".join(results)

    return search_documents