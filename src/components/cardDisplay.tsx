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

type ProductsResponse = { results: Product[] };
type CategoriesResponse = { results: Category[] };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ProductSection({ category, isFirst }: { category: Category; isFirst: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch(`/api/products?category_id=${category.id}`);
      const data = (await res.json()) as ProductsResponse;
      // shuffle products so order is random each visit
      setProducts(shuffle(data.results || []));
    };

    fetchProducts();
  }, [category.id]);

  return (
    <section id={`category-${category.slug}`}>
      <ProductCard title={category.name} products={products} isFirst={isFirst} />
    </section>
  );
}

export default function ProductSections() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch("/api/categories");
      const data = (await res.json()) as CategoriesResponse;
      // shuffle categories so section order is random each visit
      setCategories(shuffle(data.results || []));
    };

    fetchCategories();
  }, []);

  if (categories.length === 0) return null;

  return (
    <div>
      {categories.map((category, i) => (
        <ProductSection key={category.id} category={category} isFirst={i === 0} />
      ))}
    </div>
  );
}