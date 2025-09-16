import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User, Laptop, Shirt, Home, Dumbbell } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VoiceRecorder } from "@/components/voice-recorder";
import { ImageUploader } from "@/components/image-uploader";

const samplePrompts = [
  {
    icon: Laptop,
    title: "Find a laptop",
    description: "Gaming laptop under $1500 with good graphics",
  },
  {
    icon: Shirt,
    title: "Fashion search",
    description: "Casual summer dress for outdoor events",
  },
  {
    icon: Home,
    title: "Home decor",
    description: "Modern minimalist coffee table for small spaces",
  },
  {
    icon: Dumbbell,
    title: "Fitness gear",
    description: "Home gym equipment for strength training",
  },
];

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const searchMutation = useMutation({
    mutationFn: async ({ query, type, file }: { query?: string; type: string; file?: File }) => {
      const formData = new FormData();
      if (query) formData.append("query", query);
      formData.append("type", type);
      if (file) formData.append("image", file);

      const response = await apiRequest("POST", "/api/search", formData);
      return response.json();
    },
    onSuccess: (data) => {
      setLocation(`/search/${data.searchId}`);
    },
    onError: (error) => {
      toast({
        title: "Search Failed",
        description: error.message || "Failed to process your search. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!query.trim()) {
      toast({
        title: "Empty Search",
        description: "Please enter a product description",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate({ query: query.trim(), type: "text" });
  };

  const handleSamplePrompt = (description: string) => {
    setQuery(description);
  };

  const handleVoiceSearch = (audioBlob: Blob) => {
    const audioFile = new File([audioBlob], "audio.wav", { type: "audio/wav" });
    searchMutation.mutate({ type: "voice", file: audioFile });
  };

  const handleImageSearch = (imageFile: File) => {
    searchMutation.mutate({ type: "image", file: imageFile });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Search className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">ShopAI</h1>
          </div>
          <Button variant="ghost" size="icon" data-testid="button-profile">
            <User className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl space-y-8">
          {/* Welcome Message */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Find products with AI</h2>
            <p className="text-muted-foreground text-lg">
              Describe what you're looking for, upload an image, or use voice search
            </p>
          </div>

          {/* Sample Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {samplePrompts.map((prompt, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:bg-accent transition-all"
                onClick={() => handleSamplePrompt(prompt.description)}
                data-testid={`card-sample-prompt-${index}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <prompt.icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-medium text-card-foreground">{prompt.title}</h3>
                      <p className="text-sm text-muted-foreground">{prompt.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Input Area */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-end space-x-3">
                {/* Image Upload */}
                <ImageUploader 
                  onImageSelect={handleImageSearch} 
                  disabled={searchMutation.isPending}
                />

                {/* Voice Input */}
                <VoiceRecorder 
                  onRecordingComplete={handleVoiceSearch}
                  disabled={searchMutation.isPending}
                />

                {/* Text Input */}
                <div className="flex-1">
                  <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Describe the product you're looking for..."
                    className="chat-input resize-none border-none bg-transparent placeholder-muted-foreground"
                    rows={1}
                    disabled={searchMutation.isPending}
                    data-testid="input-search-query"
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSearch}
                  disabled={searchMutation.isPending || !query.trim()}
                  size="icon"
                  data-testid="button-search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {searchMutation.isPending && (
            <div className="text-center text-muted-foreground">
              <p>Processing your search...</p>
            </div>
          )}

          {/* Terms */}
          <p className="text-center text-sm text-muted-foreground">
            By using ShopAI, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </main>
    </div>
  );
}
