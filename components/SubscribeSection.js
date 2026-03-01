// components/SubscribeSection.js
const SubscribeSection = () => {
  return (
    <div className="flex flex-col w-full md:flex-row justify-center items-center rounded-md p-4">
      {/* Input Field */}
      <input
        type="email"
        placeholder="Your email address"
        className="p-3 w-full md:max-w-lg rounded-md md:rounded-l-md md:rounded-r-none bg-[#E6F2EC] text-black placeholder-primary focus:outline-none"
      />

      {/* Subscribe Button */}
      <button className="mt-3 md:mt-0 md:ml-2 p-3 w-full md:w-auto bg-primary text-white rounded-md md:rounded-r-md md:rounded-l-none hover:bg-white/15">
        Subscribe
      </button>
    </div>
  );
};

export default SubscribeSection;
