'use client';

import { useEffect, useState } from 'react';
import HouseCard, { House } from '@/components/HouseCard';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Home() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        console.log("Đang gọi Firebase Firestore...");
        const querySnapshot = await getDocs(collection(db, 'houses'));
        console.log("Đã lấy được dữ liệu Firestore!");
        const housesData: House[] = [];
        querySnapshot.forEach((doc) => {
          housesData.push({ id: doc.id, ...doc.data() } as House);
        });
        setHouses(housesData);
      } catch (err: any) {
        console.error("Lỗi khi tải nhà: ", err);
        setError(err.message || "Không thể kết nối đến Database. Bạn đã bật Firestore Database trong Firebase Console chưa?");
      } finally {
        setLoading(false);
      }
    };

    fetchHouses();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center" style={{ minHeight: '50vh' }}>Đang tải dữ liệu... (Vui lòng đợi hoặc kiểm tra Console báo lỗi)</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center gap-4" style={{ minHeight: '50vh', color: 'var(--danger)' }}>
        <h2>❌ Đã xảy ra lỗi</h2>
        <p>{error}</p>
        <div style={{ maxWidth: '600px', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', color: 'var(--text-primary)' }}>
          <p><strong>Gợi ý sửa lỗi:</strong></p>
          <ol style={{ paddingLeft: '1.5rem' }}>
            <li>Vào <a href="https://console.firebase.google.com/" target="_blank" style={{textDecoration: 'underline'}}>Firebase Console</a>.</li>
            <li>Chọn dự án <strong>nhatdat-56d50</strong>.</li>
            <li>Ở menu bên trái, chọn <strong>Build &gt; Firestore Database</strong>.</li>
            <li>Bấm <strong>Create database</strong> (Chọn Test mode để dễ sử dụng).</li>
            <li>Khởi động lại server bằng cách nhấn <code>Ctrl + C</code> rồi gõ lại <code>npm run dev</code>.</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Danh sách nhà đang xem xét</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Bạn đã lưu {houses.length} căn nhà.</p>
        </div>
        <Link href="/add" className="btn btn-primary">
          + Thêm Nhà Mới
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map(house => (
          <HouseCard key={house.id} house={house} />
        ))}
      </div>
      
      {houses.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
          <h3>Chưa có dữ liệu</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Bạn chưa lưu căn nhà nào. Hãy bắt đầu tìm kiếm!</p>
          <Link href="/add" className="btn btn-primary">
            Thêm Nhà Mới Ngay
          </Link>
        </div>
      )}
    </div>
  );
}
