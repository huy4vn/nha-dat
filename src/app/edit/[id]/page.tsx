'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function EditHousePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [newlyUploadedImages, setNewlyUploadedImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    address: '',
    description: '',
    price: '',
    area: '',
    phone: '',
    type: 'Nhà đất',
    imageUrls: [] as string[],
  });

  useEffect(() => {
    const fetchHouse = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'houses', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const images = data.imageUrls && data.imageUrls.length > 0 
            ? data.imageUrls 
            : (data.imageUrl ? [data.imageUrl] : []);
            
          setFormData({
            address: data.address || '',
            description: data.description || '',
            price: data.price ? Number(data.price).toLocaleString('vi-VN') : '',
            area: data.area || '',
            phone: data.phone || '',
            type: data.type || 'Nhà đất',
            imageUrls: images,
          });
        } else {
          alert('Không tìm thấy nhà này!');
          router.push('/');
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHouse();
  }, [id, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadToCloudinary = async (file: File) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
      fd.append('folder', 'nha-dat');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, data.secure_url] }));
        setNewlyUploadedImages(prev => [...prev, data.secure_url]);
      }
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      alert("Lỗi khi tải ảnh lên Cloudinary!");
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('video') !== -1) {
        e.preventDefault();
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

  const deleteImagesFromCloudinary = async (urls: string[]) => {
    for (const url of urls) {
      try {
        await fetch('/api/delete-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
      } catch (err) {
        console.error("Failed to delete image:", url, err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const houseRef = doc(db, 'houses', id);
      await updateDoc(houseRef, {
        address: formData.address,
        description: formData.description,
        price: Number(formData.price.replace(/\D/g, '')),
        area: formData.area,
        phone: formData.phone,
        type: formData.type,
        imageUrls: formData.imageUrls,
      });
      
      if (removedImages.length > 0) {
        await deleteImagesFromCloudinary(removedImages);
      }
      
      router.push('/');
    } catch (error) {
      console.error("Error updating document: ", error);
      alert('Đã xảy ra lỗi khi lưu! Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Bạn có chắc chắn muốn XÓA VĨNH VIỄN căn nhà này không?')) {
      setIsDeleting(true);
      try {
        if (formData.imageUrls && formData.imageUrls.length > 0) {
          await deleteImagesFromCloudinary(formData.imageUrls);
        }
        await deleteDoc(doc(db, 'houses', id));
        router.push('/');
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert('Lỗi khi xóa!');
        setIsDeleting(false);
      }
    }
  };

  if (loading) {
    return <div className="text-center py-10">Đang tải thông tin...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Chỉnh sửa thông tin</h1>
        <button onClick={handleDelete} disabled={isDeleting} className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white' }}>
          {isDeleting ? 'Đang xóa...' : '🗑️ Xóa Nhà'}
        </button>
      </div>
      
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
              {formData.imageUrls.map((url, idx) => {
                const isVideo = url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/upload/');
                return (
                  <div key={idx} style={{ position: 'relative', aspectRatio: '1 / 1' }}>
                    {isVideo ? (
                      <video src={url} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    ) : (
                      <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                    )}
                    <button 
                      type="button" 
                      onClick={() => {
                        setRemovedImages(prev => [...prev, url]);
                        setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== idx) }));
                      }}
                      style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', backgroundColor: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <CldUploadWidget 
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            options={{ folder: 'nha-dat', multiple: true, resourceType: 'auto' }}
            onSuccess={(result) => {
              if (typeof result.info === 'object' && 'secure_url' in result.info) {
                const url = result.info.secure_url;
                setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
                setNewlyUploadedImages(prev => [...prev, url]);
              }
            }}
          >
            {({ open }) => {
              return (
                <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => open()}>
                  Tải thêm ảnh (Cloudinary)
                </button>
              );
            }}
          </CldUploadWidget>
        </div>

        <div className="flex gap-4 justify-end">
          <button type="button" onClick={async () => {
            if (newlyUploadedImages.length > 0) {
              setSaving(true);
              await deleteImagesFromCloudinary(newlyUploadedImages);
            }
            router.push('/');
          }} className="btn btn-secondary" disabled={saving}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
