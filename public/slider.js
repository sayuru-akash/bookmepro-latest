import { Radius } from "lucide-react";
import React from "react";

const Slider = ({ currentIndex }) => {
  // Inline CSS styles for the slider component
  const sliderContainerStyle = {
    position: "relative",
    width: "301px",
    height: "9px",
  };

  const sliderLineStyle = {
    position: "absolute",
    width: "250px",
    height: "0",
    left: "30px",
    top: "23px",
    border: "1px solid #037D40", 
  };

  const sliderFrameStyle = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    width: "250px",
    height: "9px",
    left: "35px",
    top: "19px",
  };

  const ellipseStyle = {
    margin: "0 auto",
    width: "10px",
    height: "10px",
    background: "#B1D7C4", 
    flex: "none",
    borderRadius: "50%",
    order: 0,
    flexGrow: 0,
  };

  const greenEllipseStyle = {
    ...ellipseStyle,
    background: "#037D40", 
  };

  // Generate the dots for the slider based on the currentIndex
  const ellipses = [0, 1, 2,3]; // assuming you have 4 dots
  return (
    <div style={sliderContainerStyle}>
      <div style={sliderLineStyle}></div>
      <div style={sliderFrameStyle}>
        {ellipses.map((index) => (
          <div
            key={index}
            style={index === currentIndex ? greenEllipseStyle : ellipseStyle}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default Slider;
