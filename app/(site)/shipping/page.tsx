import PolicyPage from "@/components/policy-page"
export const metadata = { title: "Shipping policy | CrownHouse" }
export default function Page() {
  return (
    <PolicyPage title="Shipping policy">
      <p>Last updated: October 13, 2026</p>
      <p>
        At CrownHouse, owned and managed by ECOM CROWN (OPC) PVT. LTD, we aim to
        deliver your orders safely and efficiently. We currently deliver within
        India.
      </p>
      <h2>Order processing</h2>
      <p>
        Orders are typically processed within 1–3 business days after order
        confirmation. Orders placed on weekends or public holidays are processed
        on the next business day. Cash-on-delivery orders do not require advance
        payment.
      </p>
      <h2>Shipping time</h2>
      <p>
        Estimated delivery times depend on your location and courier
        availability. Contact us with your PIN code for an estimate. Delivery
        estimates are not guaranteed.
      </p>
      <h2>Shipping charges</h2>
      <p>
        Shipping costs ₹99 for an item subtotal below ₹599 and is free from
        ₹599. The shipping charge and final cash-on-delivery total are displayed
        at checkout before you place your order.
      </p>
      <h2>Tracking orders</h2>
      <p>
        Once an order is dispatched and tracking details are recorded, signed-in
        customers can view the carrier and tracking reference in their order
        history. Guest customers can contact us with their order number. Please
        allow time for courier tracking updates to appear. Automated email and
        SMS tracking notifications are not currently available.
      </p>
      <h2>Delivery delays</h2>
      <p>
        Courier issues, weather, public holidays or unforeseen circumstances may
        cause delays. Contact us so we can help follow up with the delivery
        partner. Nothing in this policy limits your applicable consumer rights.
      </p>
      <h2>Incorrect shipping information</h2>
      <p>
        Customers are responsible for accurate shipping details. Contact us
        promptly if you notice an error. We may be unable to change an address
        once dispatched; an incorrect address may require reshipping and
        additional delivery charges.
      </p>
      <h2>Damaged or incorrect deliveries</h2>
      <p>
        Contact our customer support within 48 hours of delivery with your order
        number and clear photos if an item is damaged or incorrect. We will
        review the issue and arrange a replacement or refund where applicable.
        This reporting window does not limit rights available under applicable
        law.
      </p>
      <h2>Returns related to shipping</h2>
      <p>
        Eligible unused items in their original condition with all tags attached
        may be returned within 14 days of delivery. Contact us for approval and
        instructions before sending an item back. Customers pay return shipping
        unless the item received is defective or incorrect.
      </p>
      <h2>Contact us</h2>
      <p>
        For shipping support, contact our customer service team using the
        details below and include your order number.
      </p>
    </PolicyPage>
  )
}
