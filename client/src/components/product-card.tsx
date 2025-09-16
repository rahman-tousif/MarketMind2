import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, ExternalLink } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

export function ProductCard({ product, viewMode = "grid" }: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imageError, setImageError] = useState(false);

  const renderStars = (rating: string) => {
    const numRating = parseFloat(rating);
    const fullStars = Math.floor(numRating);
    const hasHalfStar = numRating % 1 >= 0.5;

    return (
      <div className="flex items-center text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < fullStars
                ? "fill-current"
                : i === fullStars && hasHalfStar
                ? "fill-current opacity-50"
                : "stroke-current fill-transparent"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);

  if (viewMode === "list") {
    return (
      <Card className="product-card hover:shadow-lg transition-all cursor-pointer" data-testid={`card-product-${product.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {/* Image */}
            <div className="w-32 h-32 flex-shrink-0">
              {!imageError ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover rounded-lg"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">No image</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-card-foreground text-sm line-clamp-2 flex-1">
                  {product.title}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFavorited(!isFavorited)}
                  className="flex-shrink-0 ml-2"
                  data-testid={`button-favorite-${product.id}`}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                </Button>
              </div>

              {product.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {product.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Price */}
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.originalPrice!)}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  {product.rating && (
                    <div className="flex items-center space-x-1">
                      {renderStars(product.rating)}
                      <span className="text-xs text-muted-foreground">
                        ({product.rating}) {product.reviewCount || 0} reviews
                      </span>
                    </div>
                  )}
                </div>

                {/* Source */}
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {product.source}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    data-testid={`button-external-link-${product.id}`}
                  >
                    <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="product-card hover:shadow-lg transition-all cursor-pointer" data-testid={`card-product-${product.id}`}>
      <CardContent className="p-4">
        {/* Image */}
        <div className="relative mb-3">
          {!imageError ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-48 object-cover rounded-lg"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              Sale
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          {/* Title and Favorite */}
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-card-foreground text-sm line-clamp-2 flex-1">
              {product.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorited(!isFavorited)}
              className="flex-shrink-0 ml-2"
              data-testid={`button-favorite-${product.id}`}
            >
              <Heart className={`h-4 w-4 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
            </Button>
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center space-x-1">
              {renderStars(product.rating)}
              <span className="text-xs text-muted-foreground">
                ({product.rating}) {product.reviewCount || 0} reviews
              </span>
            </div>
          )}

          {/* Price and Source */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-foreground">
                {formatPrice(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice!)}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Badge variant="secondary" className="text-xs">
                {product.source}
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                asChild
                data-testid={`button-external-link-${product.id}`}
              >
                <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>

          {/* Brand */}
          {product.brand && (
            <div className="text-xs text-muted-foreground">
              by {product.brand}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
