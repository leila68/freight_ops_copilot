import { api } from "./client"
import type {
  Accessorial,
  EquipmentType,
  Lane,
  Quote,
  QuoteBreakdown,
  QuoteCalculateRequest,
  QuoteFilters,
} from "@/types"

// Reference data endpoints (equipment types, accessorials, lanes).
// TODO: confirm endpoint paths and response shapes with the FastAPI backend.

export const equipmentApi = {
  list: async (): Promise<EquipmentType[]> => {
    const { data } = await api.get<EquipmentType[]>("/equipment-types")
    return data
  },
  create: async (payload: Omit<EquipmentType, "id">): Promise<EquipmentType> => {
    const { data } = await api.post<EquipmentType>("/equipment-types", payload)
    return data
  },
  update: async (id: string, payload: Omit<EquipmentType, "id">): Promise<EquipmentType> => {
    const { data } = await api.put<EquipmentType>(`/equipment-types/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/equipment-types/${id}`)
  },
}

export const accessorialApi = {
  list: async (): Promise<Accessorial[]> => {
    const { data } = await api.get<Accessorial[]>("/accessorials")
    return data
  },
  create: async (payload: Omit<Accessorial, "id">): Promise<Accessorial> => {
    const { data } = await api.post<Accessorial>("/accessorials", payload)
    return data
  },
  update: async (id: string, payload: Omit<Accessorial, "id">): Promise<Accessorial> => {
    const { data } = await api.put<Accessorial>(`/accessorials/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/accessorials/${id}`)
  },
}

export const laneApi = {
  list: async (): Promise<Lane[]> => {
    const { data } = await api.get<Lane[]>("/lanes")
    return data
  },
  create: async (payload: Omit<Lane, "id">): Promise<Lane> => {
    const { data } = await api.post<Lane>("/lanes", payload)
    return data
  },
  update: async (id: string, payload: Omit<Lane, "id">): Promise<Lane> => {
    const { data } = await api.put<Lane>(`/lanes/${id}`, payload)
    return data
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/lanes/${id}`)
  },
}

export const quoteApi = {
  // Calculate a quote breakdown without necessarily persisting it.
  calculate: async (
    payload: QuoteCalculateRequest,
  ): Promise<QuoteBreakdown> => {
    const { data } = await api.post<QuoteBreakdown>("/quotes/calculate", payload)
    return data
  },

  // List quotes. Customers receive only their own; staff receive all.
  // Filters are passed as query params. TODO: confirm param names with backend.
  list: async (filters?: QuoteFilters): Promise<Quote[]> => {
    const { data } = await api.get<Quote[]>("/quotes", { params: filters })
    return data
  },
}
