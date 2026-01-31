import axios from 'axios';
import type { Node, Shipment, Disruption, Product } from './types';

const API_BASE = "";

const api = axios.create({
  baseURL: API_BASE,
});

export const getNodes = async () => (await api.get<Node[]>('/network/nodes')).data;
export const getShipments = async () => (await api.get<Shipment[]>('/shipments')).data;
export const getDisruptions = async () => (await api.get<Disruption[]>('/network/disruptions')).data;
export const getProducts = async () => (await api.get<Product[]>('/products')).data;

export const getQuote = async (shipmentId: string) => (await api.get(`/actions/quotes/${shipmentId}`)).data;
export const rerouteShipment = async (shipmentId: string, newRouteId: string) =>
  (await api.post('/actions/reroute', { shipment_id: shipmentId, new_route_id: newRouteId })).data;
