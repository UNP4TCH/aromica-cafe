export const OPEN_ORDER_MODAL_EVENT = "open-order-demo-modal";

export function openOrderDemoModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_ORDER_MODAL_EVENT));
  }
}
