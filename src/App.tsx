/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, Instagram, Globe, Youtube, Settings, X, LogIn, LogOut, Save } from "lucide-react";
import { 
  auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, 
  doc, onSnapshot, updateDoc, serverTimestamp, setDoc, getDoc 
} from "./firebase";
import type { User } from "./firebase";

interface FreeGift {
  title: string;
  tags: string;
  icon: string;
  dmLink: string;
  missionText: string;
  embedUrl: string;
}

const DEFAULT_GIFT: FreeGift = {
  title: "동물 안전 이야기 나누기",
  tags: "#인터랙티브 #교사필수템 #무료나눔",
  icon: "🐾",
  dmLink: "https://ig.me/m/your_instagram_id",
  missionText: "1. 꼬마나라 AI 티처랩 팔로우 하기\n2. 아래 버튼을 눌러 DM으로 '동물'이라고 보내기!\n3. 확인 후 링크를 보내드려요.",
  embedUrl: ""
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [freeGift, setFreeGift] = useState<FreeGift>(DEFAULT_GIFT);
  const [isCmsOpen, setIsCmsOpen] = useState(false);
  const [editGift, setEditGift] = useState<FreeGift>(DEFAULT_GIFT);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dynamic scaling logic
  const [scale, setScale] = useState(1);
  const previewRef = (node: HTMLDivElement | null) => {
    if (node) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          setScale(width / 1200);
        }
      });
      resizeObserver.observe(node);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const adminEmail = "decentration73@gmail.com";
        setIsAdmin(currentUser.email === adminEmail);
        
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: currentUser.uid,
            email: currentUser.email,
            role: currentUser.email === adminEmail ? "admin" : "user"
          });
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Listener for Free Gift
  useEffect(() => {
    const giftRef = doc(db, "content", "freeGift");
    const unsubscribe = onSnapshot(giftRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as FreeGift;
        // Handle legacy data if any
        const mergedData = { ...DEFAULT_GIFT, ...data };
        setFreeGift(mergedData);
        setEditGift(mergedData);
      } else {
        setDoc(giftRef, { ...DEFAULT_GIFT, updatedAt: serverTimestamp() });
      }
    }, (error) => {
      console.error("Firestore Error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsCmsOpen(false);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    try {
      const giftRef = doc(db, "content", "freeGift");
      await updateDoc(giftRef, {
        ...editGift,
        updatedAt: serverTimestamp()
      });
      setIsCmsOpen(false);
    } catch (error) {
      console.error("Save Error:", error);
      alert("저장에 실패했습니다. 권한을 확인해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex justify-center min-h-screen bg-bg-light">
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-lg pb-12 flex flex-col relative">
        {/* Admin Access Button */}
        <div className="absolute top-4 right-4 z-10">
          {user ? (
            <div className="flex gap-2">
              {isAdmin && (
                <button 
                  onClick={() => setIsCmsOpen(true)}
                  className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
                  title="CMS 설정"
                >
                  <Settings size={20} />
                </button>
              )}
              <button 
                onClick={handleLogout}
                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
                title="로그아웃"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-colors"
              title="관리자 로그인"
            >
              <LogIn size={20} />
            </button>
          )}
        </div>

        {/* Header */}
        <header className="bg-linear-to-br from-primary-blue to-soft-blue p-8 pt-12 text-center text-white rounded-b-[40px]">
          <span className="font-quicksand text-sm tracking-[2px] mb-2 block opacity-90">
            KOMANARA AI TEACHER LAB
          </span>
          <h1 className="text-2xl font-bold mb-2">꼬마나라 AI 티처랩</h1>
          <p className="text-sm opacity-90 leading-relaxed">
            유아교육 전문가<br />가장 앞서가는 에듀테크 콘텐츠
          </p>
        </header>

        <main className="flex-1">
          {/* Profile Section */}
          <section className="px-5 -mt-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[24px] p-5 shadow-xl text-center border border-soft-blue/10"
            >
              <div className="inline-block bg-accent-gold text-primary-blue px-3 py-1 rounded-full font-bold text-[10px] mb-2">
                DIRECTOR & PH.D
              </div>
              <h2 className="text-lg font-bold text-primary-blue mb-2">유아교육 전문가와 함께 하는 미래 교육 👋</h2>
              <p className="text-xs text-gray-500">만 3~5세 발달 맞춤형 인터랙티브 콘텐츠</p>
            </motion.div>
          </section>

          {/* Preview Box */}
          <div className="mx-5 my-6 bg-[#f0f4ff] rounded-[20px] p-4 text-center border-2 border-dashed border-soft-blue">
            <div className="bg-white rounded-[15px] p-5 mb-2 shadow-sm">
              <p className="text-sm text-gray-600 font-medium">
                {freeGift.icon} <strong className="text-gray-800">{freeGift.title}</strong>
              </p>
              <span className="text-soft-blue font-bold text-[11px] block mt-1">
                {freeGift.tags}
              </span>
              {freeGift.embedUrl ? (
                <div className="mt-4 w-full rounded-lg overflow-hidden border border-gray-100 shadow-inner bg-gray-50 relative">
                  <div 
                    ref={previewRef}
                    className="relative w-full overflow-hidden"
                    style={{ paddingBottom: `${(675 / 1200) * 100}%` }}
                  >
                    <iframe 
                      src={freeGift.embedUrl} 
                      className="absolute top-0 left-0 border-0 origin-top-left"
                      style={{ 
                        transform: `scale(${scale})`,
                        width: '1200px',
                        height: '675px'
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-4xl">🎞️</div>
              )}
              <p className="text-[10px] mt-2 text-gray-400">
                (전체 자료는 DM으로 발송됩니다)
              </p>
            </div>
          </div>

          <div className="px-5">
            {/* Mission Section */}
            <div className="bg-[#fff9e6] p-4 rounded-2xl mb-6 text-sm leading-relaxed text-gray-700">
              <div className="font-bold text-[#d4a017] mb-1">🎁 무료 나눔 참여 방법:</div>
              <div className="whitespace-pre-line">
                {freeGift.missionText}
              </div>
            </div>

            {/* DM Button */}
            <motion.a 
              href={freeGift.dmLink}
              target="_blank"
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-center bg-primary-blue text-white p-5 rounded-2xl font-bold mb-6 shadow-xl animate-pulse-custom no-underline"
            >
              <span className="mr-2 text-xl">📩</span> 자료 신청 DM 보내기
            </motion.a>

            <h2 className="text-sm font-bold mb-3 text-primary-blue">더 알아보기</h2>
            
            <div className="space-y-3">
              <motion.a 
                href="https://buly.kr/ET0I59m" 
                target="_blank"
                whileHover={{ x: 3 }}
                className="flex items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm no-underline text-primary-blue"
              >
                <div className="text-xl mr-3 w-8 text-center">🌐</div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">공식 홈페이지</h3>
                  <p className="text-[10px] opacity-70">더 많은 콘텐츠와 소식</p>
                </div>
              </motion.a>

              <motion.a 
                href="https://www.youtube.com/@komanara" 
                target="_blank"
                whileHover={{ x: 3 }}
                className="flex items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm no-underline text-primary-blue"
              >
                <div className="text-xl mr-3 w-8 text-center">🎬</div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold">티처랩 유튜브</h3>
                  <p className="text-[10px] opacity-70">에듀테크 활용 꿀팁</p>
                </div>
              </motion.a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center p-5 text-gray-400 text-[10px] border-t border-gray-100 mt-5">
          <p>© 꼬마나라 AI 티처랩. All Rights Reserved.</p>
          <div className="mt-3 flex justify-center gap-3">
            <a href="https://buly.kr/ET0I59m" className="text-gray-400 hover:text-soft-blue no-underline">홈페이지</a>
            <span className="opacity-30">|</span>
            <a href="https://www.youtube.com/@komanara" className="text-gray-400 hover:text-soft-blue no-underline">유튜브</a>
          </div>
        </footer>

        {/* CMS Modal */}
        <AnimatePresence>
          {isCmsOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-[400px] rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setIsCmsOpen(false)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-primary-blue mb-6">무료나눔 정보 수정</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">아이콘 (이모지)</label>
                    <input 
                      type="text" 
                      value={editGift.icon}
                      onChange={(e) => setEditGift({ ...editGift, icon: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-soft-blue focus:ring-2 focus:ring-soft-blue/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">제목</label>
                    <input 
                      type="text" 
                      value={editGift.title}
                      onChange={(e) => setEditGift({ ...editGift, title: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-soft-blue focus:ring-2 focus:ring-soft-blue/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">태그 (예: #인터랙티브 #무료나눔)</label>
                    <input 
                      type="text" 
                      value={editGift.tags}
                      onChange={(e) => setEditGift({ ...editGift, tags: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-soft-blue focus:ring-2 focus:ring-soft-blue/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">DM 링크 (URL)</label>
                    <input 
                      type="url" 
                      value={editGift.dmLink}
                      onChange={(e) => setEditGift({ ...editGift, dmLink: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-soft-blue focus:ring-2 focus:ring-soft-blue/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">맛보기 임베드 링크 (YouTube/Vimeo 등)</label>
                    <input 
                      type="url" 
                      placeholder="https://www.youtube.com/embed/..."
                      value={editGift.embedUrl}
                      onChange={(e) => setEditGift({ ...editGift, embedUrl: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-soft-blue focus:ring-2 focus:ring-soft-blue/20 outline-none text-sm"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">※ YouTube의 경우 '공유 &gt; 퍼가기'의 src 주소를 넣어주세요.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">참여 방법 안내 (줄바꿈 가능)</label>
                    <textarea 
                      rows={4}
                      value={editGift.missionText}
                      onChange={(e) => setEditGift({ ...editGift, missionText: e.target.value })}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-soft-blue focus:ring-2 focus:ring-soft-blue/20 outline-none text-sm resize-none"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full mt-6 bg-primary-blue text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary-blue/90 transition-colors disabled:opacity-50"
                >
                  {isSaving ? "저장 중..." : <><Save size={18} /> 변경사항 저장하기</>}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
