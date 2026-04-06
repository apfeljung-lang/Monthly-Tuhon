import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthGuard';
import { Post, Comment } from '../types';
import { MessageSquare, Heart, Send, User, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

const MOCK_POSTS: Post[] = [
  { id: '1', authorUid: '1', authorName: '차트술사', authorPhoto: 'https://picsum.photos/seed/user1/100/100', content: "비트코인이 전고점을 돌파하려는 모습이네요. 다들 어떻게 대응하시나요? 저는 분할 매도로 대응 중입니다.", likes: 24, commentCount: 5, createdAt: { toDate: () => new Date('2026-03-29T10:00:00') } },
  { id: '2', authorUid: '2', authorName: '불개미', authorPhoto: 'https://picsum.photos/seed/user2/100/100', content: "엔비디아 실적 발표가 코앞입니다. AI 섹터의 대장주인 만큼 이번에도 어닝 서프라이즈를 기대해 봅니다.", likes: 18, commentCount: 3, createdAt: { toDate: () => new Date('2026-03-29T09:30:00') } },
  { id: '3', authorUid: '3', authorName: '단타의신', authorPhoto: 'https://picsum.photos/seed/user3/100/100', content: "오늘의 매매 복기: 조급함에 추격 매수한 것이 패착이었습니다. 원칙을 지키는 게 가장 어렵네요.", likes: 12, commentCount: 2, createdAt: { toDate: () => new Date('2026-03-29T08:15:00') } },
];

const CommentSection: React.FC<{ postId: string, onCommentAdded: () => void }> = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    });
    return () => unsub();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content: newComment.trim(),
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'posts', postId), {
        commentCount: increment(1)
      });
      setNewComment('');
      onCommentAdded();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !postId || loading) return;
    
    if (window.confirm('이 댓글을 삭제하시겠습니까?')) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
        await updateDoc(doc(db, 'posts', postId), {
          commentCount: increment(-1)
        });
        onCommentAdded();
      } catch (error) {
        console.error("Error deleting comment:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <img 
              src={comment.authorPhoto || ''} 
              alt={comment.authorName} 
              className="w-8 h-8 rounded-full border border-slate-800"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 flex items-start gap-2">
              <div className="flex-1 bg-slate-800/50 rounded-2xl px-4 py-2">
                <p className="text-xs font-bold text-white">{comment.authorName}</p>
                <p className="text-sm text-slate-300">{comment.content}</p>
              </div>
              {user?.uid === comment.authorUid && (
                <button 
                  onClick={() => handleDeleteComment(comment.id)}
                  className="mt-2 text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          type="text" 
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-orange-600 transition-colors"
        />
        <button 
          disabled={loading}
          className="p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!user || !post.id) return;
    const unsub = onSnapshot(doc(db, 'posts', post.id, 'likes', user.uid), (doc) => {
      setIsLiked(doc.exists());
    });
    return () => unsub();
  }, [user, post.id]);

  const handleLike = async () => {
    if (!user || !post.id) return;
    const likeRef = doc(db, 'posts', post.id, 'likes', user.uid);
    if (isLiked) {
      await deleteDoc(likeRef);
      await updateDoc(doc(db, 'posts', post.id), { likes: increment(-1) });
    } else {
      await setDoc(likeRef, { createdAt: serverTimestamp() });
      await updateDoc(doc(db, 'posts', post.id), { likes: increment(1) });
    }
  };

  const handleDelete = async () => {
    if (!user || !post.id || post.authorUid !== user.uid) return;
    if (window.confirm('이 게시글을 삭제하시겠습니까?')) {
      await deleteDoc(doc(db, 'posts', post.id));
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src={post.authorPhoto || ''} 
            alt={post.authorName} 
            className="w-10 h-10 rounded-full border-2 border-slate-800"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="text-sm font-bold text-white">{post.authorName}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : '방금 전'}
            </p>
          </div>
        </div>
        {user?.uid === post.authorUid && (
          <button onClick={handleDelete} className="text-slate-600 hover:text-rose-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{post.content}</p>

      <div className="flex items-center gap-6 pt-2">
        <button 
          onClick={handleLike}
          className={cn(
            "flex items-center gap-2 text-xs font-bold transition-colors",
            isLiked ? "text-orange-500" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
          {post.likes || 0}
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          {post.commentCount || 0}
        </button>
      </div>

      {showComments && post.id && (
        <CommentSection postId={post.id} onCommentAdded={() => {}} />
      )}
    </motion.div>
  );
};

export default function Community() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(data.length > 0 ? data : MOCK_POSTS);
    });
    return () => unsub();
  }, []);

  const displayPosts = posts.length > 0 ? posts : MOCK_POSTS;

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.trim() || loading) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'posts'), {
        authorUid: user.uid,
        authorName: user.displayName,
        authorPhoto: user.photoURL,
        content: newPost.trim(),
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp()
      });
      setNewPost('');
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">
          Tuhon <span className="text-orange-500">커뮤니티</span>
        </h2>
        <p className="text-slate-500 font-medium">전문가들의 투자 철학을 공유하고 함께 성장하는 공간입니다.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handlePost} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <textarea 
              placeholder="투자 인사이트를 공유해 보세요..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-orange-600 transition-colors h-32 resize-none"
            />
            <div className="flex justify-end">
              <button 
                disabled={loading}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-black px-8 py-3 rounded-2xl transition-all shadow-lg shadow-orange-600/20 uppercase tracking-widest disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                게시하기
              </button>
            </div>
          </form>

          <div className="space-y-6">
            {displayPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
            <h3 className="text-xl font-bold text-white uppercase italic tracking-tighter">핫 토픽</h3>
            <div className="space-y-4">
              {['#비트코인_전망', '#나스닥_반등', '#배당주_추천', '#투혼_챌린지'].map(tag => (
                <div key={tag} className="flex items-center justify-between group cursor-pointer">
                  <span className="text-slate-400 group-hover:text-orange-500 transition-colors font-bold">{tag}</span>
                  <span className="text-[10px] font-black bg-slate-800 text-slate-500 px-2 py-1 rounded uppercase">1.2k 게시물</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-600 rounded-3xl p-8 space-y-4 shadow-2xl shadow-orange-600/20">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">리그 참여하기</h3>
            <p className="text-orange-100 text-sm font-medium">상위 1%의 전략을 실시간으로 확인하고 당신의 투혼을 증명하세요.</p>
            <button className="w-full bg-white text-orange-600 font-black py-4 rounded-2xl transition-all uppercase tracking-widest hover:scale-105 active:scale-95">
              프로로 업그레이드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
