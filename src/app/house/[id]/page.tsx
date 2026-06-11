'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function HouseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [house, setHouse] = useState<any>(null);

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
            : (data.imageUrl ? [data.imageUrl] : ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']);
            
          setHouse({
            id: docSnap.id,
            ...data,
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

  if (loading) {
    return <div className="text-center py-10" style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải thông tin chi tiết...</div>;
  }

  if (!house) {
    return null;
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)} Tỷ`;
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)} Triệu`;
    return price?.toLocaleString() || 'Thỏa thuận';
  };

  const averageRating = house.ratings ? ((house.ratings.price + house.ratings.location + house.ratings.area) / 3).toFixed(1) : 'Chưa có';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
        <button onClick={() => router.push('/')} className="btn btn-secondary">
          ← Quay lại
        </button>
        <Link href={`/edit/${id}`} className="btn btn-primary">
          ✏️ Sửa thông tin
        </Link>
      </div>
      
      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Image Gallery */}
        <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', backgroundColor: '#000', height: '400px' }}>
          {house.imageUrls.map((img: string, idx: number) => (
            <div 
              key={idx} 
              style={{ 
                minWidth: '100%', 
                height: '100%',
                backgroundImage: `url(${img})`, 
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                scrollSnapAlign: 'start' 
              }} 
            />
          ))}
        </div>
        {house.imageUrls.length > 1 && (
          <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-tertiary)', fontSize: '0.875rem' }}>
            Trượt để xem thêm ảnh ({house.imageUrls.length} ảnh)
          </div>
        )}

        <div style={{ padding: '2rem' }}>
          <div className="flex justify-between items-start" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem' }}>{house.address}</h1>
              {house.type && (
                <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-primary)', borderRadius: '1rem', fontWeight: 500 }}>
                  {house.type}
                </span>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {formatPrice(Number(house.price))} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>/ tháng</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Diện tích</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>{house.area || 'Chưa cập nhật'} {house.area && String(house.area).match(/\d$/) ? 'm²' : ''}</div>
            </div>
            <div>
              <div style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Liên hệ</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 500 }}>
                {house.phone ? (
                  <a href={`tel:${house.phone}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>📞 {house.phone}</a>
                ) : 'Chưa cập nhật'}
              </div>
            </div>
            
            {house.ratings && (
              <div className="md:col-span-2" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Đánh giá tổng quan: <strong style={{ color: 'var(--text-primary)' }}>⭐ {averageRating} / 10</strong></div>
                <div className="flex gap-4 text-sm" style={{ flexWrap: 'wrap' }}>
                  <span>💰 Giá: <strong>{house.ratings.price}</strong></span>
                  <span>📍 Vị trí: <strong>{house.ratings.location}</strong></span>
                  <span>📐 Diện tích: <strong>{house.ratings.area}</strong></span>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Mô tả chi tiết</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              {house.description || 'Chưa có mô tả chi tiết cho căn nhà này.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
