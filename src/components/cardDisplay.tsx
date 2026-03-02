"use client";

import { useEffect, useState } from "react";
import ProductCard from "./productCard";

type Category = { id: number; name: string; slug: string };
type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category_id: number;
};

// ✅ ADD response types
type ProductsResponse = { results: Product[] };
type CategoriesResponse = { results: Category[] };

function ProductSection({ category }: { category: Category }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch(`/api/products?category_id=${category.id}`);
      const data = (await res.json()) as ProductsResponse; // ✅ FIX
      setProducts(data.results || []);
    };

    fetchProducts();
  }, [category.id]);

  return (
    <section id={`category-${category.slug}`}>
      <ProductCard title={category.name} products={products} />
    </section>
  );
}

export default function ProductSections() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch("/api/categories");
      const data = (await res.json()) as CategoriesResponse; 
      setCategories(data.results || []);
    };

    fetchCategories();
  }, []);

  if (categories.length === 0) return null;

  return (
    <div>
      {categories.map(category => (
        <ProductSection key={category.id} category={category} />
      ))}
    </div>
  );
}