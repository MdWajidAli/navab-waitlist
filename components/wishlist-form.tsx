"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast, Toaster } from "react-hot-toast";
import Image from "next/image";
import { motion } from "framer-motion";

export function WishlistForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;
    setIsLoading(true);

    const toastId = toast.loading("Submitting...");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Successfully joined!", { id: toastId });
        setEmail("");
      } else {
        toast.error(data.message || "Something went wrong", { id: toastId });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Unable to connect to the server. Please try again later.", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5DC] text-gray-800 flex flex-col items-center">
      {/* Main content area */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center pb-[100px] sm:pb-8">
        {/* Header */}
        <div className="w-full text-left py-4">
          <h2 className="text-2xl font-bold text-gray-800">nawab & Co.</h2>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center my-16 sm:my-24"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Elevate Your Wardrobe
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Join the waitlist for our exclusive clothing line and be the first
            to experience revolutionary designs
          </p>
        </motion.div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-5xl mb-12">
          {[
            {
              src: "/placeholder.svg?height=400&width=300",
              alt: "Elegant suit",
            },
            {
              src: "/placeholder.svg?height=400&width=300",
              alt: "Stylish dress",
            },
            {
              src: "/placeholder.svg?height=400&width=300",
              alt: "Casual outfit",
            },
          ].map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative aspect-[3/4] rounded-lg overflow-hidden"
            >
              <Image
                src={img.src || "/placeholder.svg"}
                alt={img.alt}
                fill
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* Form Section */}
        <div
          className={`w-full ${
            isMobile
              ? "fixed bottom-0 left-0 p-4 bg-[#F5F5DC] border-t border-gray-200 shadow-lg"
              : "max-w-xl mx-auto"
          }`}
        >
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="flex flex-col sm:flex-row w-full gap-2">
              <Input
                type="email"
                required
                className="flex-grow bg-white border-gray-300 text-gray-800 placeholder-gray-500"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                className="w-full sm:w-auto bg-gray-800 text-white hover:bg-gray-700"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Join Waitlist"}
              </Button>
            </div>
            <p className="text-sm text-gray-600 text-center mt-2">
              Be the first to experience our revolutionary designs
            </p>
          </form>
        </div>
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#333",
            color: "#fff",
          },
          duration: 5000,
        }}
      />
    </main>
  );
}
