import React, { useState, useEffect } from "react";
import Button from "@mui/material/Button";
import { useRecoilValue, useSetRecoilState } from "recoil";
import Item from "./Pages/Item";
import BillOfMaterials from "./Pages/BillOfMaterials";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";
import { viewState } from "./Atom/viewState";
import { rowDataState } from "./Atom/rowDataState";
import { rowDataStateBOM } from "./Atom/rowDataStateBOM";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const App = () => {
  const isItem = useRecoilValue(viewState);
  const setViewState = useSetRecoilState(viewState);
  const rowsState = isItem ? rowDataState : rowDataStateBOM;
  const rows = useRecoilValue(rowsState);
  const setRows = useSetRecoilState(rowsState);
  const type = isItem ? "items" : "bom";

  const [data, setData] = useState([]);
  const [fileError, setFileError] = useState("");

  const handleBatchSave = async () => {
    const modifiedRows = rows.filter((row, index) => {
      const originalRow = originalData.current[index];
      return JSON.stringify(row) !== JSON.stringify(originalRow);
    });

    if (modifiedRows.length === 0) {
      console.log("No changes to save.");
      return;
    }

    console.log("Modified rows:", modifiedRows);

    try {
      await Promise.all(
        modifiedRows.map(async (row) => {
          const response = await fetch(
            `https://api-assignment.inveesync.in/${type}/${row.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(row),
            }
          );
          if (!response.ok) {
            console.error(`Failed to update row with ID ${row.id}`);
            toast.error(`Failed to update row with ID ${row.id}`);
          }
        })
      );
      console.log("All changes saved successfully.");
      originalData.current = [...rows]; // Update original data after successful save
      toast.success("All changes saved successfully.");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Error saving changes.", error);
    }
  };

  const handleDataSave = async (parsedRows) => {
    const type = isItem ? "items" : "bom";
    const results = []; // Collect success/failure results

    try {
      // Process each row and collect results
      await Promise.all(
        parsedRows.map(async (row) => {
          try {
            const response = await fetch(
              `https://api-assignment.inveesync.in/${type}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(row),
              }
            );

            if (!response.ok) {
              console.error(`Failed to update row with ID ${row.id}`);
              toast.error(`Failed to update row with ID ${row.id}`);
              results.push({ id: row.id, success: false }); // Record failure
            } else {
              results.push({ id: row.id, success: true }); // Record success
            }
          } catch (error) {
            console.error(`Error processing row with ID ${row.id}:`, error);
            toast.error(`Error processing row with ID ${row.id}`);
            results.push({ id: row.id, success: false }); // Record failure
          }
        })
      );

      // Evaluate results after processing all rows
      const allSuccessful = results.every((result) => result.success);
      console.log(allSuccessful);

      if (allSuccessful) {
        console.log("All changes saved successfully.");
        originalData.current = [...rows]; // Update original data after all saves are successful
        toast.success("All changes saved successfully.");
      } else {
        console.warn("Some rows failed to save.");
        toast.warn("Some rows failed to save. Please check errors.");
      }

      return allSuccessful;
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Error saving changes: " + error.message);
      return false; // Explicitly return false in case of an error
    }
  };

  const [errorLog, setErrorLog] = useState([]);

  const validateRow = (row, index) => {
    const errors = [];

    // Check for duplicate entries based on internal_item_name and tenant_id
    const existingItem = rows.find(
      (existingRow) =>
        existingRow.internal_item_name === row.internal_item_name ||
        existingRow.tenant_id === row.tenant_id
    );
    if (existingItem) {
      errors.push(
        `Duplicate entry: internal_item_name '${row.internal_item_name}' and tenant_id '${row.tenant_id}' already exist.`
      );
    }

    // Min/Max Buffer Validation (Only for "isItem" rows)
    if (isItem) {
      const minBuffer = parseFloat(row.min_buffer);
      const maxBuffer = parseFloat(row.max_buffer);

      if (isNaN(minBuffer) || isNaN(maxBuffer)) {
        errors.push("Buffer values must be valid numbers.");
      } else if (minBuffer < 0 || maxBuffer < 0) {
        errors.push("Buffer values cannot be negative.");
      } else if (minBuffer > maxBuffer) {
        errors.push(
          "Max buffer should be greater than or equal to Min buffer."
        );
      }
    }

    // Check for missing tenant_id or other required fields
    if (isNaN(row.tenant_id)) {
      errors.push("Tenant ID must be a valid number.");
    }

    return errors.length > 0 ? { index, errors } : null;
  };

  const validateRowBOM = (row, index) => {
    const errors = [];
    console.log(row);
    const item_id = parseInt(row.item_id);
    const component_id = parseInt(row.component_id);
    const id = parseInt(row.id);
    // Check for duplicate entries based on internal_item_name and tenant_id
    const existingItem = rows.find(
      (existingRow) =>
        (existingRow.item_id === item_id &&
          existingRow.component_id === component_id) ||
        existingRow.id === id
    );
    if (existingItem) {
      errors.push(
        `Duplicate entry: item_id '${row.item_id}' and component_id '${row.component_id}' already exist.`
      );
    }

    return errors.length > 0 ? { index, errors } : null;
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (
        file.type !==
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setFileError("Please upload a valid Excel file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // Parse the Excel file
          const workbook = XLSX.read(e.target.result, { type: "array" });
          const sheetName = workbook.SheetNames[0]; // Get first sheet
          const sheet = workbook.Sheets[sheetName];
          const parsedData = XLSX.utils.sheet_to_json(sheet);

          // Validation for the parsed data
          if (!parsedData || parsedData.length === 0) {
            setFileError("The Excel file is empty.");
            return;
          }

          // Clear previous errors
          setErrorLog([]);

          // Validate each row
          const newErrors = [];
          parsedData.forEach((row, index) => {
            if (isItem) {
              const error = validateRow(row, index + 1); // index+1 for user-friendly row numbers

              if (error) {
                newErrors.push(error);
              }
            } else {
              const error = validateRowBOM(row, index + 1); // index+1 for user-friendly
              if (error) {
                newErrors.push(error);
              }
            }
          });

          if (newErrors.length > 0) {
            setErrorLog(newErrors);
            setFileError(
              "File uploaded with errors. Check the log for details."
            );
            toast.error("File uploaded with errors.");
            return;
          }

          // If no errors, proceed to save data
          setData(parsedData);
          setRows((prevRows) => {
            const newRows = [...prevRows, ...parsedData]; // Append new rows to previous state
            return newRows; // Update state with new rows
          });

          // Proceed with saving data
          const success = await handleDataSave(parsedData);
          if (success) {
            toast.success("Data saved successfully.");
          }
          setFileError(""); // Clear any file error
        } catch (error) {
          setFileError("Error parsing the file.");
          console.error("Error parsing the file:", error);
          toast.error("Error parsing the file.", error);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (
        (isItem && event.key === "itemsTableData") ||
        (!isItem && event.key === "bomTableData")
      ) {
        const updatedData = JSON.parse(event.newValue);
        setRows(updatedData);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [isItem, setRows]);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    // Fields for Item Master
    internal_item_name: "",
    item_description: "",
    customer_item_name: "",
    created_by: "system_user",
    last_updated_by: "system_user",
    type: "",
    uom: "",
    additional_attributes: {
      avg_weight_needed: false,
      drawing_revision_number: null,
      drawing_revision_date: null,
      shelf_floor_alternate_name: null,
      scrap_type: null,
    },
    min_buffer: 0,
    max_buffer: 0,

    // Fields for BoM
    item_id: "",
    component_id: "",
    quantity: 1,
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name in formData.additional_attributes) {
      setFormData((prev) => ({
        ...prev,
        additional_attributes: {
          ...prev.additional_attributes,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      // Add timestamps to formData
      const currentDate = new Date().toISOString();
      formData.createdDate = formData.createdDate || currentDate;
      formData.updatedDate = currentDate;
      formData.createdAt = formData.createdAt || currentDate;
      formData.updatedAt = currentDate;

      if (isItem) {
        // Validation for Item Master
        if (!formData.internal_item_name || !formData.type || !formData.uom) {
          toast.error("Please fill in all mandatory fields.");
          return;
        }
        if (
          formData.type === "sell" &&
          !formData.additional_attributes.scrap_type
        ) {
          toast.error("Scrap type is mandatory for items with type 'sell'.");
          return;
        }

        if (
          (formData.min_buffer == 0 || formData.max_buffer == 0) &&
          formData.type !== "component"
        ) {
          formData.min_buffer = 0;
          formData.max_buffer = 0;
        }
        if (formData.max_buffer < formData.min_buffer) {
          toast.error(
            "Max buffer should be greater than or equal to Min buffer."
          );
          return;
        }
        const generateId = () => Math.floor(Math.random() * 10000);
        // Assign a tenant_id (you can replace 'TENANT123' with a dynamic value if needed)
        formData.tenant_id = formData.tenant_id || generateId();

        // Send data to the server and wait for the response
        const response = await fetch(
          `https://api-assignment.inveesync.in/${type}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          toast.error("Failed to add item.");
          return;
        }

        const data = await response.json();

        // Use the id returned from the server
        formData.id = data.id;

        // Update rows with the correct id
        setRows((prev) => [...prev, { ...formData }]);

        toast.success("Item added successfully.");
        handleClose();
      } else {
        // Validation for BoM
        if (!formData.item_id || !formData.component_id || !formData.quantity) {
          toast.error("Please fill in all mandatory fields.");
          return;
        }

        if (formData.quantity < 1 || formData.quantity > 100) {
          toast.error("Quantity should be between 1 and 100.");
          return;
        }

        // Assign a tenant_id (if needed)
        formData.tenant_id = formData.tenant_id || 123;

        // Send data to the server and wait for the response
        const response = await fetch(
          `https://api-assignment.inveesync.in/${type}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          toast.error("Failed to add BoM.");
          return;
        }

        const data = await response.json();

        // Use the id returned from the server
        formData.id = data.id;

        // Update rows with the correct id
        setRows((prev) => [...prev, { ...formData }]);

        toast.success("BoM added successfully.");
        handleClose();
      }
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("An error occurred while saving. Please try again.");
    }
  };

  const handleDownloadXLSX = () => {
    const formattedData = rows.map((row) => ({
      ...row,
      ...row.additional_attributes, // Flatten additional attributes
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    XLSX.writeFile(workbook, "data.xlsx");
    toast.success("Data downloaded successfully!");
  };

  const downloadErrorLogs = () => {
    const errorText = errorLog
      .map((err) => `Row ${err.index}: ${err.errors.join(", ")}\n`)
      .join("");
    const blob = new Blob([errorText], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "error_log.txt";
    link.click();
  };

  // Mock original data for comparison
  const originalData = React.useRef([...rows]);

  return (
    <div className="">
      <div className="my-2 mx-2">
        <Button
          sx={{ marginRight: "10px" }}
          variant="contained"
          disabled={isItem}
          onClick={() => setViewState(true)}
        >
          Item
        </Button>
        <Button
          variant="contained"
          disabled={!isItem}
          onClick={() => setViewState(false)}
        >
          Bill of Materials
        </Button>
      </div>

      <div className="my-2 mx-2">
        <Button
          sx={{
            marginRight: "10px",
            backgroundColor: "green",
            marginBottom: "10px",
          }}
          variant="contained"
          onClick={handleOpen}
        >
          Add
        </Button>
        <Button
          sx={{
            backgroundColor: "orangered",
            marginRight: "10px",
            marginBottom: "10px",
          }}
          variant="contained"
          onClick={handleBatchSave}
        >
          Save Changes
        </Button>

        <Button
          sx={{
            backgroundColor: "red",
            marginRight: "10px",
            marginBottom: "10px",
          }}
          variant="contained"
          onClick={handleDownloadXLSX}
        >
          Download File
        </Button>

        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          Upload files
          <VisuallyHiddenInput
            type="file"
            onChange={handleFileUpload}
            multiple
            accept=".xlsx"
          />
        </Button>

        <Button
          sx={{
            marginBottom: "10px",
            marginLeft: "10px",
            backgroundColor: "red",
          }}
          variant="contained"
          onClick={downloadErrorLogs}
        >
          Logs
        </Button>
      </div>

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" component="h2" gutterBottom>
            {isItem ? "Add Item Master" : "Add Bill of Materials"}
          </Typography>

          {isItem ? (
            <>
              <TextField
                label="Internal Item Name"
                name="internal_item_name"
                value={formData.internal_item_name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Item Description"
                name="item_description"
                value={formData.item_description}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Customer Name"
                name="customer_item_name"
                value={formData.customer_item_name}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />

              <TextField
                label="Avg Weight Needed"
                name="avg_weight_needed"
                value={formData.additional_attributes.avg_weight_needed}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                select // This makes the TextField a dropdown
              >
                <MenuItem value={"FALSE"}>False</MenuItem>
                <MenuItem value={"TRUE"}>True</MenuItem>
              </TextField>

              <TextField
                label="Type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                select
              >
                <MenuItem value="sell">Sell</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="component">Component</MenuItem>
              </TextField>
              <TextField
                label="UoM"
                name="uom"
                value={formData.uom}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                select
              >
                <MenuItem value="kgs">Kgs</MenuItem>
                <MenuItem value="nos">Nos</MenuItem>
              </TextField>
              {formData.type === "sell" && (
                <TextField
                  label="Scrap Type"
                  name="scrap_type"
                  value={formData.additional_attributes.scrap_type}
                  onChange={handleInputChange}
                  fullWidth
                  margin="normal"
                />
              )}
              <TextField
                label="Min Buffer"
                name="min_buffer"
                type="number"
                value={formData.min_buffer}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Max Buffer"
                name="max_buffer"
                type="number"
                value={formData.max_buffer}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            </>
          ) : (
            <>
              <TextField
                label="Item ID "
                name="item_id"
                value={formData.item_id}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Component ID "
                name="component_id"
                value={formData.component_id}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
              <TextField
                label="Quantity "
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
              />
            </>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            sx={{ mt: 2 }}
          >
            Save
          </Button>
        </Box>
      </Modal>

      {isItem ? (
        <div className="text-xl mx-4 my-4">Item Table </div>
      ) : (
        <div className="text-xl mx-4 my-4">Bill of Materials Table </div>
      )}

      {isItem ? (
        <Item disableSorting={true} />
      ) : (
        <BillOfMaterials disableSorting={true} />
      )}
    </div>
  );
};

export default App;
