'use client';

import Link from 'next/link';
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import './HouseCard.css';

export interface House {
  id: string;
  address: string;
  description: string;
  price: number;
  area: string;
  type?: string;
  phone?: string;
  imageUrl?: string;
  imageUrls?: string[];
  ratings: {
    price: number;
    location: number;
    area: number;
  };
}

interface HouseCardProps {
  house: House;
}

export default function HouseCard({ house }: HouseCardProps) {
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [ratings, setRatings] = useState(house.ratings);
  const [isSaving, setIsSaving] = useState(false);

  // Fallback support for old schema
  const images = house.imageUrls && house.imageUrls.length > 0 
    ? house.imageUrls 
    : (house.imageUrl ? [house.imageUrl] : ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80']);

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} Tỷ`;
    }
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} Triệu`;
    }
    return price.toLocaleString();
  };

  const handleSaveRating = async () => {
    setIsSaving(true);
    try {
      const houseRef = doc(db, 'houses', house.id);
      await updateDoc(houseRef, {
        ratings: ratings
      });
      setIsEditingRating(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật đánh giá:", error);
      alert("Không thể lưu đánh giá!");
    } finally {
      setIsSaving(false);
    }
  };

  const averageRating = (ratings.price + ratings.location + ratings.area) / 3;

  return (
    <div className="house-card" style={{ position: 'relative' }}>
      <Link href={`/edit/${house.id}`} style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', textDecoration: 'none' }}>
        ✏️ Sửa
      </Link>
      
      <div className="house-images-wrapper">
        <div className="house-images-container" style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="house-image" 
              style={{ 
                minWidth: '100%', 
                backgroundImage: `url(${img})`, 
                scrollSnapAlign: 'start' 
              }} 
            />
          ))}
        </div>
        
        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
            {images.length} ảnh
          </div>
        )}

        <div className="house-rating" style={{ position: 'absolute', top: '1rem', right: '1rem', cursor: 'pointer', zIndex: 10 }} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditingRating(!isEditingRating); }}>
          ⭐ {averageRating > 0 ? averageRating.toFixed(1) : 'Chưa chấm'} ✎
        </div>

        <Link href={`/house/${house.id}`} className="house-overlay">
          <span className="btn btn-primary" style={{ pointerEvents: 'none', boxShadow: 'var(--shadow-lg)' }}>Xem chi tiết</span>
        </Link>
      </div>
      <div className="house-content">
        <h3 className="house-title" style={{ marginBottom: '0.25rem' }}>📍 {house.address}</h3>
        {house.phone && (
          <div style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)', fontWeight: 500, fontSize: '0.875rem' }}>
            📞 <a href={`tel:${house.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>{house.phone}</a>
          </div>
        )}
        <p className="house-address" style={{ marginTop: '0', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {house.description}
        </p>
        
        {isEditingRating && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Chấm điểm (1-10)</h4>
            <div className="flex flex-col gap-2" style={{ fontSize: '0.875rem' }}>
              <div className="flex justify-between items-center">
                <span>💰 Giá thuê</span>
                <input type="number" min="0" max="10" step="0.5" value={ratings.price} onChange={(e) => setRatings({...ratings, price: Number(e.target.value)})} style={{ width: '60px', padding: '0.25rem' }} />
              </div>
              <div className="flex justify-between items-center">
                <span>📍 Vị trí</span>
                <input type="number" min="0" max="10" step="0.5" value={ratings.location} onChange={(e) => setRatings({...ratings, location: Number(e.target.value)})} style={{ width: '60px', padding: '0.25rem' }} />
              </div>
              <div className="flex justify-between items-center">
                <span>📐 Diện tích</span>
                <input type="number" min="0" max="10" step="0.5" value={ratings.area} onChange={(e) => setRatings({...ratings, area: Number(e.target.value)})} style={{ width: '60px', padding: '0.25rem' }} />
              </div>
              <button onClick={handleSaveRating} disabled={isSaving} className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.25rem' }}>
                {isSaving ? 'Đang lưu...' : 'Lưu điểm'}
              </button>
            </div>
          </div>
        )}

        <div className="house-details flex justify-between items-center" style={{ marginTop: 'auto', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div className="house-price">
              {formatPrice(house.price)}<span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>/tháng</span>
            </div>
            {house.type && (
              <span style={{ display: 'inline-block', marginTop: '0.25rem', padding: '0.1rem 0.5rem', backgroundColor: 'var(--bg-tertiary)', color: 'var(--accent-primary)', fontSize: '0.75rem', borderRadius: '1rem', fontWeight: 500 }}>
                {house.type}
              </span>
            )}
          </div>
          <div className="house-area flex flex-col items-end gap-2" style={{ textAlign: 'right' }}>
            <div>
              {house.area && house.area.trim() !== '' ? (
                <>{house.area} {String(house.area).match(/\d$/) ? 'm²' : ''}</>
              ) : (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Chưa rõ DT</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
