import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../ProductCard';
import { Product } from '../api';

const mockProduct: Product = {
    id: '1',
    restaurant_id: 'rest-1',
    category_id: 'cat-1',
    name: 'Pizza Margherita',
    description: 'Deliciosa pizza con tomate y queso',
    price: 25.50,
    cost: 12.00,
    is_available: true,
    track_inventory: true,
    stock_quantity: 15,
    is_taxable: true,
    created_at: '2026-01-05T00:00:00Z',
    updated_at: '2026-01-05T00:00:00Z',
    categories: {
        id: 'cat-1',
        name: 'Pizzas',
        restaurant_id: 'rest-1',
        description: null,
        color: '#ff0000',
        icon: null,
        sort_order: 0,
        is_active: true,
        created_at: '2026-01-05T00:00:00Z',
        updated_at: '2026-01-05T00:00:00Z',
        synced_at: null,
        metadata: {},
    },
};

describe('ProductCard', () => {
    it('renders product information correctly', () => {
        render(<ProductCard product={mockProduct} />);

        expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
        expect(screen.getByText('Deliciosa pizza con tomate y queso')).toBeInTheDocument();
        expect(screen.getByText(/S\/ 25\.50/)).toBeInTheDocument();
        expect(screen.getByText('Pizzas')).toBeInTheDocument();
    });

    it('shows stock badge when tracking inventory', () => {
        render(<ProductCard product={mockProduct} />);

        expect(screen.getByText(/Stock: 15/)).toBeInTheDocument();
    });

    it('shows unavailable badge when product is not available', () => {
        const unavailableProduct = { ...mockProduct, is_available: false };
        render(<ProductCard product={unavailableProduct} />);

        expect(screen.getByText('No disponible')).toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', () => {
        const handleEdit = jest.fn();
        render(<ProductCard product={mockProduct} onEdit={handleEdit} />);

        const editButton = screen.getByText('Editar');
        editButton.click();

        expect(handleEdit).toHaveBeenCalledWith(mockProduct);
    });

    it('calls onDelete when delete button is clicked', () => {
        const handleDelete = jest.fn();
        render(<ProductCard product={mockProduct} onDelete={handleDelete} />);

        const deleteButton = screen.getByText('Eliminar');
        deleteButton.click();

        expect(handleDelete).toHaveBeenCalledWith('1');
    });
});
