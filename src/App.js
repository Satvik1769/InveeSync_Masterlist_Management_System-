import React from "react";
import Button from "@mui/material/Button";
import { atom, useRecoilState, RecoilRoot } from "recoil";
import Item from "./Pages/Item";
import BillOfMaterials from "./Pages/BillOfMaterials";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";

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
// Define Recoil atom outside the component
const viewState = atom({
  key: "viewState",
  default: true, // Default to showing the Item table
});

// Sample JSON data

const App = () => {
  const [isItem, setViewState] = useRecoilState(viewState);

  return (
    <RecoilRoot>
      <div className="">
        <div className="my-2 mx-2">
          <Button
            sx={{ marginRight: "10px" }}
            variant="contained"
            disabled={isItem} // Disabled based on the current state
            onClick={() => setViewState(true)} // Set state to true
          >
            Item
          </Button>
          <Button
            variant="contained"
            disabled={!isItem} // Disabled when the state is true
            onClick={() => setViewState(false)} // Set state to false
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
          >
            Edit
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

        {isItem ? <div>Item Table</div> : <div>Bill of Materials Table</div>}

        {isItem ? <Item /> : <BillOfMaterials />}
      </div>
    </RecoilRoot>
  );
};

export default App;
