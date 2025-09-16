import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, Search, MessageCircle, Grid3X3, List, Filter } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ChatSidebar } from "@/components/chat-sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface FilterOptions {
  brands: { name: string; count: number }[];
  categories: { name: string; count: number }[];
}

export default function MarketplacePage() {
  const [, params] = useRoute("/search/:searchId");
  const [, setLocation] = useLocation();
  const [chatOpen, setChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const searchId = params?.searchId;

  // Get search details
  const { data: searchData } = useQuery({
    queryKey: ["/api/search", searchId],
    enabled: !!searchId,
  });

  // Get products with filters
  const { data: productsData, isLoading: productsLoading } = useQuery<ProductsResponse>({
    queryKey: [
      "/api/search",
      searchId,
      "products",
      { 
        minPrice: priceRange[0], 
        maxPrice: priceRange[1], 
        brands: selectedBrands,
        categories: selectedCategories,
        minRating,
        sortBy,
        page: currentPage 
      }
    ],
    enabled: !!searchId,
  });

  // Get filter options
  const { data: filterOptions } = useQuery<FilterOptions>({
    queryKey: ["/api/filters/options"],
  });

  // Update filters mutation
  const updateFiltersMutation = useMutation({
    mutationFn: (filters: any) => 
      apiRequest("POST", `/api/search/${searchId}/filters`, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/search", searchId, "products"] });
    },
  });

  // Apply filters
  useEffect(() => {
    if (searchId) {
      updateFiltersMutation.mutate({
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        brands: selectedBrands,
        categories: selectedCategories,
        minRating,
        sortBy,
      });
    }
  }, [priceRange, selectedBrands, selectedCategories, minRating, sortBy]);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setMinRating(0);
    setSortBy("relevance");
    setCurrentPage(1);
  };

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  if (!searchId) {
    setLocation("/");
    return null;
  }

  const FilterSidebar = () => (
    <div className="w-80 bg-card border-r border-border p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearFilters}
          data-testid="button-clear-filters"
        >
          Clear All
        </Button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="font-medium text-card-foreground mb-3">Price Range</h4>
        <div className="space-y-3">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={1000}
            step={10}
            className="w-full"
            data-testid="slider-price-range"
          />
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
              className="w-full"
              data-testid="input-price-min"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
              className="w-full"
              data-testid="input-price-max"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      {filterOptions?.categories && filterOptions.categories.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-card-foreground mb-3">Category</h4>
          <div className="filter-section space-y-2">
            {filterOptions.categories.map((category) => (
              <div key={category.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.name}`}
                  checked={selectedCategories.includes(category.name)}
                  onCheckedChange={() => handleCategoryToggle(category.name)}
                  data-testid={`checkbox-category-${category.name}`}
                />
                <label
                  htmlFor={`category-${category.name}`}
                  className="text-sm text-card-foreground cursor-pointer"
                >
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brands */}
      {filterOptions?.brands && filterOptions.brands.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-card-foreground mb-3">Brand</h4>
          <div className="filter-section space-y-2">
            {filterOptions.brands.map((brand) => (
              <div key={brand.name} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand.name}`}
                  checked={selectedBrands.includes(brand.name)}
                  onCheckedChange={() => handleBrandToggle(brand.name)}
                  data-testid={`checkbox-brand-${brand.name}`}
                />
                <label
                  htmlFor={`brand-${brand.name}`}
                  className="text-sm text-card-foreground cursor-pointer"
                >
                  {brand.name}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setLocation("/")}
                data-testid="button-back-to-landing"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Search className="h-4 w-4 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-semibold text-foreground">ShopAI</h1>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Refine your search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                  data-testid="input-refine-search"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  data-testid="button-refine-search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Toggle */}
            <Button
              onClick={() => setChatOpen(!chatOpen)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-toggle-chat"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Filter Sidebar */}
        {!isMobile && <FilterSidebar />}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {(searchData as any)?.search?.query ? `Search Results` : "Products"}
              </h2>
              <p className="text-muted-foreground">
                {productsData?.total || 0} products found
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Mobile Filter Button */}
              {isMobile && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" data-testid="button-mobile-filters">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="p-6 pb-0">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <FilterSidebar />
                  </SheetContent>
                </Sheet>
              )}

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48" data-testid="select-sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Sort by: Relevance</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex border border-border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-view-grid"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                  <div className="w-full h-48 bg-muted rounded-lg mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : productsData?.products && productsData.products.length > 0 ? (
            <>
              <div className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                  : "grid-cols-1"
              }`}>
                {productsData.products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* Load More */}
              {productsData.hasMore && (
                <div className="text-center mt-12">
                  <Button
                    onClick={loadMore}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    data-testid="button-load-more"
                  >
                    Load More Products
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No products found matching your search.</p>
              <Button 
                onClick={clearFilters} 
                className="mt-4"
                data-testid="button-clear-search-filters"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Chat Sidebar */}
      <ChatSidebar 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(false)} 
        searchId={searchId}
      />
    </div>
  );
}
