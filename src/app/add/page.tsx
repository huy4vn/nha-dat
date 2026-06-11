'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AddHousePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    address: '',
    description: '',
    price: '',
    area: '',
    phone: '',
    type: 'Nhà đất',
    imageUrls: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadToCloudinary = async (file: File) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
      fd.append('folder', 'nha-dat');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, data.secure_url] }));
      }
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      alert("Lỗi khi tải ảnh lên Cloudinary!");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default paste if we found an image
        const file = items[i].getAsFile();
        if (file) {
          await uploadToCloudinary(file);
        }
        break;
      }
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formattedValue = rawValue ? Number(rawValue).toLocaleString('vi-VN') : '';
    setFormData(prev => ({ ...prev, price: formattedValue }));
  };

  const getPriceHelperText = (priceString: string) => {
    const price = Number(priceString.replace(/\D/g, ''));
    if (!price) return '';
    if (price >= 1000000000) return `~ ${(price / 1000000000).toFixed(2).replace('.00', '')} Tỷ`;
    if (price >= 1000000) return `~ ${(price / 1000000).toFixed(2).replace('.00', '')} Triệu`;
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'houses'), {
        address: formData.address,
        description: formData.description,
        price: Number(formData.price.replace(/\D/g, '')),
        area: formData.area,
        phone: formData.phone,
        type: formData.type,
        imageUrls: formData.imageUrls,
        ratings: {
          price: 0,
          location: 0,
          area: 0
        }
      });
      router.push('/');
    } catch (error) {
      console.error("Error adding document: ", error);
      alert('Đã xảy ra lỗi khi lưu! Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Thêm Nhà Mới</h1>
      
      <form onSubmit={handleSubmit} onPaste={handlePaste} className="glass" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        
        <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--accent-primary)', textAlign: 'center', fontSize: '0.875rem' }}>
          💡 <strong>Mẹo:</strong> Bạn có thể nhấn <code>Ctrl + V</code> ở bất cứ đâu trên biểu mẫu này để dán ảnh trực tiếp từ bộ nhớ tạm!
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Địa chỉ</label>
            <input 
              type="text" 
              name="address" 
              required
              value={formData.address}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
              placeholder="VD: Hẻm 123 Đường ABC..."
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>SĐT Liên hệ</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
              placeholder="VD: 0901234567"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Loại nhà</label>
          <select 
            name="type" 
            value={formData.type}
            onChange={handleChange as any}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          >
            <option value="Nhà đất">Nhà đất</option>
            <option value="Chung cư mini">Chung cư mini</option>
            <option value="Chung cư">Chung cư</option>
            <option value="Phòng trọ">Phòng trọ</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Giá thuê (VNĐ)</label>
            <input 
              type="text" 
              name="price" 
              required
              value={formData.price}
              onChange={handlePriceChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
              placeholder="VD: 5,000,000"
            />
            {formData.price && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                {getPriceHelperText(formData.price)}
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Diện tích</label>
            <input 
              type="text" 
              name="area" 
              value={formData.area}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }} 
              placeholder="VD: 30m2 hoặc 5x6"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Thông tin bổ sung</label>
          <textarea 
            name="description" 
            rows={4}
            value={formData.description}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', resize: 'vertical' }} 
            placeholder="Ghi chú thêm về nội thất, điện nước, liên hệ..." 
          ></textarea>
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Hình ảnh</label>
          
          {formData.imageUrls.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
              {formData.imageUrls.map((url, idx) => (
                <div key={idx} style={{ position: 'relative', aspectRatio: '1 / 1' }}>
                  <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }))}
                    style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', backgroundColor: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <CldUploadWidget 
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            options={{ folder: 'nha-dat', multiple: true }}
            onSuccess={(result) => {
              if (typeof result.info === 'object' && 'secure_url' in result.info) {
                const url = result.info.secure_url;
                setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
              }
            }}
          >
            {({ open }) => {
              return (
                <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => open()}>
                  Tải ảnh lên (Cloudinary)
                </button>
              );
            }}
          </CldUploadWidget>
          
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Bạn có thể nhấn nút tải ảnh, hoặc bấm Ctrl+V để dán trực tiếp nhiều ảnh.
          </div>
        </div>

        <div className="flex gap-4 justify-end">
          <button type="button" onClick={() => router.push('/')} className="btn btn-secondary" disabled={loading}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu Thông Tin'}
          </button>
        </div>
      </form>
    </div>
  );
}
