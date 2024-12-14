import React from "react";
import TableComponent from "../Components/TableComponent";

const sampleData = {
  internal_item_name: "ABC123",
  tenant_id: 123,
  item_description: "Sample Item",
  uom: "Nos",
  created_by: "user1",
  last_updated_by: "user2",
  type: "sell",
  max_buffer: 10,
  min_buffer: 5,
  customer_item_name: "Customer ABC",
  is_deleted: false,
  createdAt: "2023-04-01T12:00:00Z",
  updatedAt: "2023-04-10T15:30:00Z",
  additional_attributes: {
    drawing_revision_number: 1,
    drawing_revision_date: "2023-04-01",
    avg_weight_needed: true,
    scrap_type: "scrap_a",
    shelf_floor_alternate_name: "shelf_1",
  },
};

export default function BillOfMaterials() {
  return (
    <div>
      <TableComponent data={sampleData} />
    </div>
  );
}
