import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { viewState } from "../Atom/viewState";
import { rowDataState } from "../Atom/rowDataState";
import { rowDataStateBOM } from "../Atom/rowDataStateBOM";

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

  const handleDelete = (index) => {
    const updatedRows = rows.filter((_, rowIndex) => rowIndex !== index);
    setRows(updatedRows);
    if (onDelete) onDelete(updatedRows);
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
      if (isAdditional) {
        // Update additional_attributes
        updatedRows[rowIndex] = {
          ...updatedRows[rowIndex],
          additional_attributes: {
            ...updatedRows[rowIndex].additional_attributes,
            [additionalHeaders[columnIndex]]: newValue,
          },
        };
      } else {
        // Update regular cell
        updatedRows[rowIndex] = {
          ...updatedRows[rowIndex],
          [headers[columnIndex]]: newValue,
        };
      }
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
                        {row[header] || "N/A"}
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
                        {row.additional_attributes?.[attrKey] || "N/A"}
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
