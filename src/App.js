import React from "react";
import Button from "@mui/material/Button";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Item from "./Pages/Item";
import BillOfMaterials from "./Pages/BillOfMaterials";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";
import { viewState } from "./Atom/viewState";
import { rowDataState } from "./Atom/rowDataState";
import { rowDataStateBOM } from "./Atom/rowDataStateBOM";

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
  const type = isItem ? "items" : "bom";

  // Mock original data for comparison
  const originalData = React.useRef([...rows]);

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
          }
        })
      );
      console.log("All changes saved successfully.");
      originalData.current = [...rows];
    } catch (error) {
      console.error("Error saving changes:", error);
    }
  };

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
          sx={{ marginRight: "10px", backgroundColor: "green" }}
          variant="contained"
        >
          Add
        </Button>
        <Button
          sx={{ backgroundColor: "orangered", marginRight: "10px" }}
          variant="contained"
          onClick={handleBatchSave}
        >
          Save Changes
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
            onChange={(event) => console.log(event.target.files)}
            multiple
          />
        </Button>
      </div>

      {isItem ? <div>Item Table </div> : <div>Bill of Materials Table </div>}

      {isItem ? (
        <Item disableSorting={true} />
      ) : (
        <BillOfMaterials disableSorting={true} />
      )}
    </div>
  );
};

export default App;
