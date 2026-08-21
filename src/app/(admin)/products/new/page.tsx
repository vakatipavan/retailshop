import Header from '@/components/Header';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <Header title="Add New Product" />
      <div style={{ maxWidth: '800px' }}>
        <ProductForm />
      </div>
    </div>
  );
}
