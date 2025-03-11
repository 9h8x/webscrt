import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
  } from "@/components/ui/drawer";
  import { useState, useEffect } from "react";
  
  const DrawerImage = ({ imageUrl }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
  
    // Only load the image when component mounts (after page content loads)
    useEffect(() => {
      // Small delay to ensure page content loads first
      const timer = setTimeout(() => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => setIsLoaded(true);
      }, 100);
  
      return () => clearTimeout(timer);
    }, [imageUrl]);
  
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <div className="aspect-square relative overflow-hidden rounded-md hover:opacity-90 transition-all duration-300 bg-gray-100 cursor-pointer">
            {isLoaded ? (
              <img
                title="Preview"
                src={imageUrl}
                loading="lazy"
                className="w-full h-full object-cover"
                alt="Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <DrawerTitle>Image</DrawerTitle>
              <DrawerDescription>
                <div className="relative w-full max-h-[70vh] overflow-auto">
                  <img
                    title="Full view"
                    src={imageUrl}
                    loading="lazy"
                    className="w-full"
                    alt="Full view"
                  />
                </div>
              </DrawerDescription>
            </DrawerHeader>
          </div>
        </DrawerContent>
      </Drawer>
    );
  };
  
  export default DrawerImage;