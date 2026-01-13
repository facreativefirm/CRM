import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Package, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/lib/store/settingsStore";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ProductForm } from "@/components/admin/products/ProductForm";

interface Product {
    id: number;
    name: string;
    productType?: string;
    monthlyPrice?: number | string;
}

interface ProductSelectorProps {
    value?: number;
    onChange: (value: number, product?: Product) => void;
    className?: string;
}

export function ProductSelector({ value, onChange, className }: ProductSelectorProps) {
    const { formatPrice } = useSettingsStore();
    const [open, setOpen] = useState(false);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/products");
            setProducts(response.data.data.products || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter((prod) => {
        const name = (prod.name || "").toLowerCase();
        const term = search.toLowerCase();
        return name.includes(term);
    });

    const selectedProduct = products.find((prod) => prod.id === value);

    const handleProductCreated = (newProduct: any) => {
        setSheetOpen(false);
        setProducts(prev => [...prev, newProduct]);
        onChange(newProduct.id, newProduct);
        setOpen(false);
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-12 rounded-xl bg-background border-input font-normal hover:bg-accent hover:text-accent-foreground"
                    >
                        {selectedProduct ? (
                            <span className="flex items-center gap-2 truncate">
                                <Package size={16} className="text-primary" />
                                <span className="font-semibold">{selectedProduct.name}</span>
                                <span className="text-muted-foreground text-xs">({formatPrice(selectedProduct.monthlyPrice || 0)})</span>
                            </span>
                        ) : (
                            <span className="text-muted-foreground">{loading ? "Loading..." : "Select product..."}</span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0 bg-background" align="start">
                    <div className="p-2 border-b">
                        <div className="flex items-center border rounded-md px-3 bg-secondary/20">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <Input
                                className="border-0 focus-visible:ring-0 bg-transparent h-9"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                        {filteredProducts.length === 0 && !loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No products found.
                            </div>
                        )}
                        {filteredProducts.map((prod) => (
                            <div
                                key={prod.id}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-md px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                                    value === prod.id && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                    onChange(prod.id, prod);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === prod.id ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span className="font-medium">{prod.name}</span>
                                    <span className="text-xs text-muted-foreground">{prod.productType || "PRODUCT"} • {formatPrice(prod.monthlyPrice || 0)}/mo</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t bg-secondary/10">
                        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                            <SheetTrigger asChild>
                                <Button size="sm" className="w-full gap-2" variant="secondary">
                                    <Plus size={14} />
                                    Add New Product
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
                                <SheetHeader>
                                    <SheetTitle>Add New Product</SheetTitle>
                                    <SheetDescription>
                                        Create a new product instantly.
                                    </SheetDescription>
                                </SheetHeader>
                                <div className="mt-6">
                                    <ProductForm
                                        onSuccess={handleProductCreated}
                                        onCancel={() => setSheetOpen(false)}
                                    />
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
