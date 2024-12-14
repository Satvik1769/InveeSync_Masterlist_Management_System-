import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRecoilState } from "recoil";
import { viewState } from "../Atom/viewState";

const TableComponent = ({ data, onDelete }) => {
  const [rows, setRows] = useState(Array.isArray(data) ? data : [data]);
  const [editingCell, setEditingCell] = useState(null);

  const headers =
    rows.length > 0
      ? Object.keys(rows[0]).filter((key) => key !== "additional_attributes")
      : [];

  const [isItem, setItem] = useRecoilState(viewState);

  const additionalHeaders = isItem
    ? [
        "drawing_revision_number",
        "drawing_revision_date",
        "avg_weight_needed",
        "scrap_type",
        "shelf_floor_alternate_name",
      ]
    : [];

  const handleDelete = (index) => {
    // Remove the row at the specified index
    const updatedRows = rows.filter((_, rowIndex) => rowIndex !== index);

    // If there are no rows left after deletion, we set rows to an empty array
    if (updatedRows.length === 0) {
      setRows([]);
    } else {
      setRows(updatedRows);
    }

    // Optionally, call onDelete if you want to pass the updated data to a parent component
    if (onDelete) {
      onDelete(updatedRows);
    }
  };

  const handleCellClick = (rowIndex, columnIndex) => {
    setEditingCell({ rowIndex, columnIndex });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const updateCellValue = (rowIndex, columnIndex, newValue) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        [headers[columnIndex]]: newValue,
      };
      return updatedRows;
    });
  };

  return (
    <div className="overflow-x-auto w-full px-10 pb-10">
      <table className="min-w-full border border-collapse border-gray-300">
        <thead>
          <tr>
            {headers.length > 0 ? (
              headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-left text-gray-700 uppercase"
                >
                  {header.replace(/_/g, " ").toUpperCase()}
                </th>
              ))
            ) : (
              <th className="px-4 py-2 text-left text-gray-700 uppercase">
                No data
              </th>
            )}
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
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length + additionalHeaders.length + 1}
                className="px-4 py-2 text-center"
              >
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {/* Render regular columns */}
                {headers.map((header, columnIndex) => (
                  <td key={header} className="px-4 py-2 border-t">
                    {editingCell?.rowIndex === rowIndex &&
                    editingCell?.columnIndex === columnIndex ? (
                      <input
                        type="text"
                        value={row[header] || ""}
                        onChange={(e) =>
                          updateCellValue(rowIndex, columnIndex, e.target.value)
                        }
                        onBlur={handleCellBlur}
                        className="w-full"
                      />
                    ) : (
                      <span
                        onClick={() => handleCellClick(rowIndex, columnIndex)}
                      >
                        {row[header] || "N/A"}
                      </span>
                    )}
                  </td>
                ))}

                {/* Render Additional Attributes */}
                {additionalHeaders.map((attrKey, idx) => (
                  <td key={idx} className="px-4 py-2 border-t">
                    {row.additional_attributes &&
                    row.additional_attributes[attrKey] !== undefined ? (
                      <span>{String(row.additional_attributes[attrKey])}</span>
                    ) : (
                      <span>N/A</span>
                    )}
                  </td>
                ))}

                <td className="px-4 py-2 border-t">
                  <IconButton
                    aria-label="delete"
                    sx={{ color: "red" }}
                    onClick={() => handleDelete(rowIndex)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableComponent;
