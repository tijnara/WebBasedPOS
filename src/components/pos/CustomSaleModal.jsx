import React, { useState, useEffect } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogCloseButton,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Input,
    Label,
    Select
} from '../ui';
import { useStore } from '../../store/useStore';

const CustomSaleModal = ({ isOpen, onClose, products, onAddItem }) => {
    const [customSaleProduct, setCustomSaleProduct] = useState('');
    const [customSalePrice, setCustomSalePrice] = useState('');
    const [customSaleQuantity, setCustomSaleQuantity] = useState('1');
    const { addToast } = useStore();

    useEffect(() => {
        if (isOpen) {
            setCustomSaleProduct('');
            setCustomSalePrice('');
            setCustomSaleQuantity('1');
        }
    }, [isOpen]);

    const handleCustomProductChange = (productId) => {
        const product = products.find(p => String(p.id) === String(productId));
        if (product) {
            setCustomSaleProduct(product.id);
            setCustomSalePrice(String(product.price || 0));
        } else {
            setCustomSaleProduct('');
            setCustomSalePrice('');
        }
    };

    const handleCustomSaleSubmit = (e) => {
        e.preventDefault();
        const selectedProduct = products.find(p => String(p.id) === String(customSaleProduct));
        const parsedPrice = parseFloat(customSalePrice);
        const parsedQuantity = parseInt(customSaleQuantity, 10);

        if (!selectedProduct) {
            addToast({ title: 'Error', description: 'Please select a valid product.', variant: 'destructive' });
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            addToast({ title: 'Error', description: 'Please enter a valid, non-negative price.', variant: 'destructive' });
            return;
        }
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            addToast({ title: 'Error', description: 'Please enter a valid quantity greater than 0.', variant: 'destructive' });
            return;
        }

        onAddItem(selectedProduct, parsedQuantity, parsedPrice);
        addToast({ title: 'Item Added', description: `${parsedQuantity} x ${selectedProduct.name} at ₱${parsedPrice.toFixed(2)} each added.`, variant: 'success' });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Custom Sale Item</DialogTitle>
                    <DialogCloseButton onClick={onClose} />
                </DialogHeader>
                <form onSubmit={handleCustomSaleSubmit}>
                    <div className="p-4 space-y-4">
                        <div>
                            <Label htmlFor="customProduct">Product</Label>
                            <Select
                                id="customProduct"
                                className="w-full"
                                value={customSaleProduct}
                                onChange={(e) => handleCustomProductChange(e.target.value)}
                                required
                            >
                                <option value="" disabled>-- Select Product --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} (₱{p.price?.toFixed(2)})
                                    </option>
                                ))}
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="customPrice">Custom Price (₱)</Label>
                            <Input
                                id="customPrice"
                                type="number"
                                step="0.01"
                                min="0"
                                value={customSalePrice}
                                onChange={e => setCustomSalePrice(e.target.value)}
                                required
                                className="w-full"
                            />
                        </div>
                        <div>
                            <Label htmlFor="customQuantity">Quantity</Label>
                            <Input
                                id="customQuantity"
                                type="number"
                                step="1"
                                min="1"
                                value={customSaleQuantity}
                                onChange={e => setCustomSaleQuantity(e.target.value)}
                                required
                                className="w-full"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary">Add to Order</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CustomSaleModal;

