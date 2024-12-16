import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { viewState } from "../Atom/viewState";
import { rowDataState } from "../Atom/rowDataState";
import { rowDataStateBOM } from "../Atom/rowDataStateBOM";
import { toast } from "react-toastify";

const TableComponent = ({ data, onDelete }) => {
  const isItem = useRecoilValue(viewState);
  const rowsState = isItem ? rowDataState : rowDataStateBOM;
  const rows = useRecoilValue(rowsState);
  const setRows = useSetRecoilState(rowsState);

  // Use Recoil for rows state

  const [editingCell, setEditingCell] = useState(null);

  // Update rows initially if data is passed
  React.useEffect(() => {
    if (Array.isArray(data)) {
      setRows(data);
    }
  }, [data, setRows]);

  const headers =
    rows.length > 0
      ? Object.keys(rows[0]).filter((key) => key !== "additional_attributes")
      : [];

  const additionalHeaders = isItem
    ? [
        "drawing_revision_number",
        "drawing_revision_date",
        "avg_weight_needed",
        "scrap_type",
        "shelf_floor_alternate_name",
      ]
    : [];

  const handleDelete = async (index) => {
    const type = isItem ? "items" : "bom";

    // Get the ID of the row to be deleted
    const rowToDelete = rows[index];
    if (!rowToDelete || !rowToDelete.id) {
      console.error("Row or ID not found.");
      toast.error("Row or ID not found.");

      return;
    }

    const response = await fetch(
      `https://api-assignment.inveesync.in/${type}/${rowToDelete.id}`, // Use the unique ID
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      console.error("Error deleting the row:", response.statusText);
      toast.error(data.message);
      return;
    }

    console.log("Delete response:", data);

    // Update the local state by removing the deleted row
    const updatedRows = rows.filter((_, rowIndex) => rowIndex !== index);
    setRows(updatedRows);
    toast.success("Row deleted successfully.");

    if (onDelete) {
      onDelete(updatedRows);
    }
  };

  const handleCellClick = (rowIndex, columnIndex, isAdditional = false) => {
    setEditingCell({ rowIndex, columnIndex, isAdditional });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const updateCellValue = (rowIndex, columnIndex, newValue, isAdditional) => {
    setRows((prevRows) => {
      const updatedRows = [...prevRows];
      const rowToUpdate = updatedRows[rowIndex];

      // Determine the key being updated
      const key = isAdditional
        ? additionalHeaders[columnIndex]
        : headers[columnIndex];

      // Clone the row for modifications
      const updatedRow = isAdditional
        ? {
            ...rowToUpdate,
            additional_attributes: {
              ...rowToUpdate.additional_attributes,
              [key]: newValue,
            },
          }
        : {
            ...rowToUpdate,
            [key]: newValue,
          };

      // Perform validations
      const minBuffer = parseFloat(updatedRow.min_buffer || 0);
      const maxBuffer = parseFloat(updatedRow.max_buffer || 0);

      if (key === "min_buffer" || key === "max_buffer") {
        if (minBuffer < 0 || maxBuffer < 0) {
          toast.error("Buffer values must be greater than 0.");
          return prevRows; // Discard changes
        }

        if (minBuffer >= maxBuffer) {
          toast.error("Min Buffer must be less than Max Buffer.");
          return prevRows; // Discard changes
        }
      }

      // Add any additional validations here as needed

      updatedRows[rowIndex] = updatedRow;
      return updatedRows;
    });
  };

  return (
    <div className="overflow-x-auto w-full px-10 pb-10">
      <table className="min-w-full border border-collapse border-gray-300">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-2 text-left text-gray-700 uppercase"
              >
                {header.replace(/_/g, " ").toUpperCase()}
              </th>
            ))}
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
                    editingCell?.columnIndex === columnIndex &&
                    !editingCell?.isAdditional ? (
                      <input
                        type="text"
                        value={row[header] || ""}
                        onChange={(e) =>
                          updateCellValue(
                            rowIndex,
                            columnIndex,
                            e.target.value,
                            false
                          )
                        }
                        onBlur={handleCellBlur}
                        className="w-full"
                      />
                    ) : (
                      <span
                        onClick={() =>
                          handleCellClick(rowIndex, columnIndex, false)
                        }
                      >
                        {row[header] ?? "N/A"}
                      </span>
                    )}
                  </td>
                ))}

                {/* Render Additional Attributes */}
                {additionalHeaders.map((attrKey, columnIndex) => (
                  <td key={attrKey} className="px-4 py-2 border-t">
                    {editingCell?.rowIndex === rowIndex &&
                    editingCell?.columnIndex === columnIndex &&
                    editingCell?.isAdditional ? (
                      <input
                        type="text"
                        value={row.additional_attributes?.[attrKey] || ""}
                        onChange={(e) =>
                          updateCellValue(
                            rowIndex,
                            columnIndex,
                            e.target.value,
                            true
                          )
                        }
                        onBlur={handleCellBlur}
                        className="w-full"
                      />
                    ) : (
                      <span
                        onClick={() =>
                          handleCellClick(rowIndex, columnIndex, true)
                        }
                      >
                        {row.additional_attributes?.[attrKey] ?? "N/A"}
                      </span>
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
