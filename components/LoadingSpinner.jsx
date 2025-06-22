export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = {
    sm: "h-4 w-4 border-t-2",
    md: "h-8 w-8 border-t-3",
    lg: "h-12 w-12 border-t-4"
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`${sizes[size]} border-blue-500 border-solid rounded-full animate-spin`}
      ></div>
    </div>
  );
}