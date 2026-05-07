import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Save, ArrowLeft, Trash2 } from "lucide-react";
import type { RootState } from "../store/store";
import { useAppDispatch } from "../store/hooks";
import type { Asset } from "../store/types";
import { createAsset, updateAsset, deleteAsset } from "../store/slices/assetsSlice";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import Select from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Card from "@/components/ui/card";

type AssetCategory = "crypto" | "stock" | "forex" | "commodity";

type AssetFormData = {
	symbol: string;
	name: string;
	image_url: string;
	category: AssetCategory;
	description: string;
	is_active: boolean;
};

const buildFormData = (asset?: Asset | null): AssetFormData => ({
	symbol: asset?.symbol || "",
	name: asset?.name || "",
	image_url: asset?.image_url || "",
	category: (asset?.category as AssetCategory) || "crypto",
	description: asset?.description || "",
	is_active: asset?.is_active !== false,
});

const AssetForm = () => {
	const { symbol } = useParams<{ symbol: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { assets, isLoading } = useSelector((state: RootState) => state.assets);

	const existingAsset = symbol ? assets.find((a: Asset) => a.symbol === symbol) : null;
	const isEditing = Boolean(existingAsset);
	const [draft, setDraft] = useState<AssetFormData | null>(null);
	const formData = draft ?? buildFormData(existingAsset);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isEditing) {
			dispatch(updateAsset({ symbol: symbol!, data: formData }));
		} else {
			dispatch(createAsset(formData));
		}
		navigate("/markets");
	};

	const handleDelete = () => {
		if (!symbol) return;
		if (window.confirm("Are you sure you want to delete this asset?")) {
			dispatch(deleteAsset(symbol));
			navigate("/markets");
		}
	};

	const updateFormData = (patch: Partial<AssetFormData>) => {
		setDraft({ ...formData, ...patch });
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
			className="max-w-2xl mx-auto"
		>
			<div className="flex items-center gap-4 mb-6">
				<button
					onClick={() => navigate(-1)}
					className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all text-white/60 hover:text-white"
				>
					<ArrowLeft className="w-5 h-5" />
				</button>
				<h1 className="text-2xl font-bold text-white">
					{isEditing ? `Edit ${symbol}` : "Create New Asset"}
				</h1>
			</div>

			<Card className="p-6" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
				<form onSubmit={handleSubmit} className="space-y-5">
					<div>
						<Label className="mb-2 block">Symbol *</Label>
						<Input
							value={formData.symbol}
							onChange={(e) => updateFormData({ symbol: e.target.value.toUpperCase() })}
							placeholder="e.g. BTCUSDT"
							required
							disabled={isEditing}
						/>
					</div>
					<div>
						<Label className="mb-2 block">Name *</Label>
						<Input
							value={formData.name}
							onChange={(e) => updateFormData({ name: e.target.value })}
							placeholder="e.g. Bitcoin"
							required
						/>
					</div>
					<div>
						<Label className="mb-2 block">Image URL</Label>
						<Input
							value={formData.image_url}
							onChange={(e) => updateFormData({ image_url: e.target.value })}
							placeholder="https://..."
						/>
					</div>
					<div>
						<Label className="mb-2 block">Category</Label>
						<Select
							value={formData.category}
							onChange={(e) => updateFormData({ category: e.target.value as AssetCategory })}
						>
							<option value="crypto">Crypto</option>
							<option value="stock">Stock</option>
							<option value="forex">Forex</option>
							<option value="commodity">Commodity</option>
						</Select>
					</div>
					<div>
						<Label className="mb-2 block">Description</Label>
						<textarea
							value={formData.description}
							onChange={(e) => updateFormData({ description: e.target.value })}
							placeholder="Asset description..."
							rows={4}
							className="flex w-full rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-2 text-sm text-white shadow-sm transition-all duration-200 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/50 resize-none"
						/>
					</div>
					<div className="flex items-center gap-3">
						<input
							type="checkbox"
							checked={formData.is_active}
							onChange={(e) => updateFormData({ is_active: e.target.checked })}
							className="w-4 h-4 rounded accent-white"
						/>
						<Label className="text-sm text-white/60">Active</Label>
					</div>
					<div className="flex gap-3 pt-2">
						<Button type="submit" className="flex-1" disabled={isLoading}>
							<Save className="w-4 h-4 mr-2" />
							{isEditing ? "Update" : "Create"}
						</Button>
						{isEditing && (
							<Button type="button" variant="destructive" onClick={handleDelete}>
								<Trash2 className="w-4 h-4 mr-2" />
								Delete
							</Button>
						)}
					</div>
				</form>
			</Card>
		</motion.div>
	);
};

export default AssetForm;
