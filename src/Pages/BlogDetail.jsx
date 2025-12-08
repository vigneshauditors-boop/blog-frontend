import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Clock,
  Eye,
  Heart,
  Calendar,
  User,
  Tag,
  Link as LinkIcon,
  FileText
} from 'lucide-react';

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // YouTube helpers (match CreateContent / CaseStudyDetail)
  const getYouTubeId = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.replace('/', '') || null;
      }
      const vParam = u.searchParams.get('v');
      if (vParam) return vParam;
      const parts = u.pathname.split('/');
      const last = parts[parts.length - 1];
      if (last && last !== 'watch') return last;
      return null;
    } catch {
      return null;
    }
  };

  const isYouTubeLink = (url) => !!getYouTubeId(url);

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/blogs/${slug}`);
        
        if (res.ok) {
          const data = await res.json();
          setBlog(data);
        } else {
          setError('Blog post not found');
        }
      } catch (err) {
        setError('Failed to load blog post');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  useEffect(() => {
    if (!blog || !user) {
      setLiked(false);
      return;
    }
    const hasLiked =
      blog.likedBy?.some((id) => id === user._id || id === user.id) || false;
    setLiked(hasLiked);
  }, [blog, user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (liked || likeLoading) return;

    try {
      setLikeLoading(true);
      const res = await fetch(`http://localhost:5000/api/blogs/${slug}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to like');
      }

      setLiked(true);
      setBlog((prev) =>
        prev
          ? {
              ...prev,
              likes: data.likes,
              likedBy: [...(prev.likedBy || []), user._id]
            }
          : prev
      );
    } catch (err) {
      console.error('Like error:', err);
    } finally {
      setLikeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The blog post you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/blog')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Back to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/blog')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors duration-200"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Blog
        </button>

        {/* Blog Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {blog.title}
          </h1>
          
          <p className="text-xl text-gray-600 mb-6 leading-relaxed">
            {blog.description}
          </p>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-t border-gray-200 pt-6">
            <div className="flex items-center">
              <User size={16} className="mr-2" />
              <span className="font-medium">{blog.authorName}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              <span>{formatDate(blog.createdAt)}</span>
            </div>
            
            <div className="flex items-center">
              <Clock size={16} className="mr-2" />
              <span>{blog.readTime || 5} min read</span>
            </div>
            
            <div className="flex items-center">
              <Eye size={16} className="mr-2" />
              <span>{(blog.views || 0).toLocaleString()} views</span>
            </div>
            
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleLike}
                disabled={liked || likeLoading}
                className={`inline-flex items-center px-2 py-1 rounded-full border text-xs transition-colors ${
                  liked
                    ? 'bg-red-100 border-red-200 text-red-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Heart
                  size={16}
                  className={`mr-1.5 ${
                    liked ? 'text-red-600 fill-red-200' : 'text-gray-500'
                  }`}
                />
                <span>
                  {(blog.likes || 0).toLocaleString()} like
                  {(blog.likes || 0) === 1 ? '' : 's'}
                </span>
              </button>
            </div>
          </div>

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {blog.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  <Tag size={14} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Blog Image */}
        {blog.image && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full h-auto rounded-lg"
            />
          </div>
        )}

        {/* Blog Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="prose prose-lg max-w-none">
            <div 
              className="text-gray-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: (blog.content || '').replace(/\n/g, '<br>') }}
            />
          </div>
        </div>

        {/* Reference Links (supports YouTube) */}
        {blog.links && blog.links.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <LinkIcon size={20} className="mr-2" />
              Reference Links
            </h3>
            <div className="space-y-4">
              {blog.links.map((link, idx) => {
                const videoId = getYouTubeId(link.url);
                const isYT = isYouTubeLink(link.url);

                if (isYT && videoId) {
                  return (
                    <div
                      key={idx}
                      className="bg-slate-900 rounded-xl p-3 md:p-4 text-slate-50 shadow-md border border-slate-700"
                    >
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold">
                          {link.heading || 'YouTube Video'}
                        </h4>
                        {link.caption && (
                          <p className="text-xs text-slate-300">
                            {link.caption}
                          </p>
                        )}
                      </div>

                      <div className="relative w-full h-48 md:h-56 lg:h-64 rounded-lg overflow-hidden bg-black">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={link.heading || 'YouTube Video'}
                          className="absolute top-0 left-0 w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>

                      <div className="mt-1 text-[11px] text-slate-300 break-all">
                        {link.url}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">
                      {link.heading || 'Reference Link'}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline break-all text-xs"
                    >
                      {link.url}
                    </a>
                    {link.caption && (
                      <div className="text-xs text-gray-500 mt-1">
                        {link.caption}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Documents */}
        {blog.documents && blog.documents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FileText size={20} className="mr-2" />
              Attached Documents
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {blog.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText size={16} className="text-gray-500 mr-3" />
                    <div>
                      <div className="font-medium text-sm text-gray-900 truncate max-w-xs">
                        {doc.originalName || doc.fileName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : 'Document'}
                      </div>
                    </div>
                  </div>
                  <a
                    href={`http://localhost:5000${doc.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Author Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">About the Author</h3>
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 font-semibold text-2xl flex items-center justify-center mr-4">
              {(blog.authorName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{blog.authorName}</h4>
              <p className="text-gray-600">Author & Developer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
