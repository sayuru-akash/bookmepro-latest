"use client";
import { useState } from "react";
import Slider from "../public/slider"; 

const testimonials = [
  {
    text: "Lorem ipsum dolor sit amet consectetur. Adipiscing ut nisi leo nibh eros in. Sed nulla quis scelerisque vitae. Fringilla massa facilisis non mattis mauris nisl. Dui ut hendrerit fames imperdiet proin nisl sit mauris.",
    author: "Francis Towne",
    role: "Future Response Technician",
  },
  {
    text: "Lorem ipsum dolor sit amet consectetur. Adipiscing ut nisi leo nibh eros in. Sed nulla quis scelerisque vitae. Fringilla massa facilisis non mattis mauris nisl. Dui ut hendrerit fames imperdiet proin nisl sit mauris.",
    author: "John Doe",
    role: "Project Manager",
  },
  {
    text: "Lorem ipsum dolor sit amet consectetur. Adipiscing ut nisi leo nibh eros in. Sed nulla quis scelerisque vitae. Fringilla massa facilisis non mattis mauris nisl. Dui ut hendrerit fames imperdiet proin nisl sit mauris.",
    author: "Jane Smith",
    role: "Design Lead",
  },
];

const TestimonialSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handlers to navigate between testimonials
  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="w-full flex flex-col justify-center space-y-8  md:px-8 lg:px-12">
      {/* Testimonial Content */}
      <div className="text-center md:text-left">
        <p className="text-lg md:text-[26px] mt-4 md:mt-8 font-[275] text-black">
          {testimonials[currentIndex].text}
        </p>
        <p className="mt-4 md:mt-8 text-lg md:text-[26px] text-black font-normal">
          {testimonials[currentIndex].author}
        </p>
        <p className="text-sm md:text-lg font-normal text-black">
          {testimonials[currentIndex].role}
        </p>
      </div>

      {/* Slider Navigation */}
      <div className="flex items-center justify-center md:justify-between flex-wrap md:flex-wrap">
        <div className="flex  ">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="p-2 md:p-3 bg-primary text-white rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-4 h-4 md:w-5 md:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          {/* Slider Component */}
          <Slider className="flex justify-center" currentIndex={currentIndex} />

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="p-2 md:p-3 bg-primary text-white rounded-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-4 h-4 md:w-5 md:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        {/* Explore All Button */}
        {/* <button className="w-full mt-4 my-5 md:w-auto px-4 md:px-6 py-2 md:py-[13px] bg-primary text-white font-semibold rounded-lg">
          Explore All
        </button> */}
      </div>
    </div>
  );
};

export default TestimonialSlider;
