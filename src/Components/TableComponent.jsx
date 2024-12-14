import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";

const TableComponent = ({ data, onDelete }) => {
  // Convert the data to an array if it's a single object
  const rowData = Array.isArray(data) ? data : [data];

  // State to hold the rows (you need to manage this in the component)
  const [rows, setRows] = useState(rowData);

  // Extract the main headers excluding `additional_attributes`
  const headers = Object.keys(rows[0]).filter(
    (key) => key !== "additional_attributes"
  );

  const handleDelete = (index) => {
    // Remove the row at the specified index
    const updatedRows = rows.filter((_, rowIndex) => rowIndex !== index);
    setRows(updatedRows);

    // Optionally, call onDelete if you want to pass the updated data to a parent component
    if (onDelete) {
      onDelete(updatedRows);
    }
  };

  // Predefined headers for additional attributes (split across multiple columns)
  const additionalHeaders = [
    "drawing_revision_number",
    "drawing_revision_date",
    "avg_weight_needed",
    "scrap_type",
    "shelf_floor_alternate_name",
  ];

  return (
    <div className="overflow-x-auto w-full px-10 pb-10">
      <table className="min-w-full border border-collapse border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-2 text-left text-gray-700 uppercase"
              >
                {header.replace(/_/g, " ").toUpperCase()}
              </th>
            ))}
            {/* Additional Attributes Header with 4 Subcolumns */}
            {additionalHeaders.map((header, idx) => (
              <th
                key={idx}
                className="px-4 py-2 text-left text-gray-700 uppercase"
              >
                {header.replace(/_/g, " ").toUpperCase()}
              </th>
            ))}
            <th className="px-4 py-2 text-left text-gray-700 uppercase">
              Delete
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {/* Render regular columns */}
              {headers.map((header) => (
                <td key={header} className="px-4 py-2 border-t">
                  {String(row[header]) || "N/A"}
                </td>
              ))}

              {/* Render Additional Attributes */}
              {additionalHeaders.map((attrKey, idx) => (
                <td key={idx} className="px-4 py-2 border-t">
                  {row.additional_attributes &&
                  row.additional_attributes[attrKey] !== undefined
                    ? String(row.additional_attributes[attrKey])
                    : "N/A"}
                </td>
              ))}

              {/* Render Delete Button */}
              <td className="px-4 py-2 border-t">
                <IconButton
                  aria-label="delete"
                  sx={{ color: "red" }}
                  onClick={() => handleDelete(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableComponent;
