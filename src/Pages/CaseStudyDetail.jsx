// src/pages/CaseStudyDetail.jsx (updated to match CreateContent UI)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft,
  Eye,
  Heart,
  Calendar,
  User,
  Tag,
  Briefcase,
  Download,
  Link as LinkIcon,
  FileText,
  BookOpen
} from 'lucide-react';

const CaseStudyDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [caseStudy, setCaseStudy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Copy YouTube helpers from CreateContent
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
    const fetchCaseStudy = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5000/api/case-studies/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setCaseStudy(data);
        } else {
          setError('Case study not found');
        }
      } catch (err) {
        setError('Failed to load case study');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchCaseStudy();
  }, [slug]);

  // Update liked state when user or caseStudy changes
  useEffect(() => {
    if (!caseStudy || !user) {
      setLiked(false);
      return;
    }
    const hasLiked =
      caseStudy.likedBy?.some((id) => id === user._id || id === user.id) || false;
    setLiked(hasLiked);
  }, [caseStudy, user]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

  const getCategoryLabel = (category) => {
    const categories = {
      'web-apps': 'Web Applications',
      'mobile-apps': 'Mobile Applications',
      'windows-apps': 'Windows Applications',
      'digital-marketing': 'Digital Marketing',
      'ad-shoot': 'Ad Shoot'
    };
    return categories[category] || category;
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (liked || likeLoading) return;

    try {
      setLikeLoading(true);
      const res = await fetch(
        `http://localhost:5000/api/case-studies/${slug}/like`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to like');
      }

      setLiked(true);
      setCaseStudy((prev) =>
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

  // Function to render HTML content with line breaks (matches CreateContent preview)
  const renderHtml = (html) => ({
    __html: (html || '').replace(/\n/g, '<br />')
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !caseStudy) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center bg-white rounded-xl shadow-sm border border-gray-100 p-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Case Study Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error || 'The case study you are looking for does not exist.'}
            </p>
            <button
              onClick={() => navigate('/case-studies')}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Case Studies
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/case-studies')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 mb-6"
          >
            <ArrowLeft size={20} />
            <span>Back to Case Studies</span>
          </button>
        </div>

        {/* Main Content Card (matches CreateContent preview) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:px-7 md:py-6">
          {/* Highlight (if exists) */}
          {caseStudy.highlight && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <strong className="block mb-1 text-xs uppercase tracking-wide">
                Update / Highlight
              </strong>
              <span>{caseStudy.highlight}</span>
            </div>
          )}

          {/* Title and Description */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen size={20} className="text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">Case Study</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {caseStudy.title}
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              {caseStudy.description}
            </p>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6 border-b border-gray-200 pb-4">
            <div className="flex items-center">
              <User size={16} className="mr-1.5 text-gray-400" />
              <span className="font-medium text-gray-800">{caseStudy.authorName}</span>
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-1.5 text-gray-400" />
              <span>{formatDate(caseStudy.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <Eye size={16} className="mr-1.5 text-gray-400" />
              <span>{(caseStudy.views || 0).toLocaleString()} views</span>
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
                  {(caseStudy.likes || 0).toLocaleString()} like
                  {(caseStudy.likes || 0) === 1 ? '' : 's'}
                </span>
              </button>
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
              Category: {getCategoryLabel(caseStudy.category)}
            </span>
          </div>

          {/* Tags */}
          {caseStudy.tags && caseStudy.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {caseStudy.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  <Tag size={12} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Main Content (HTML rendered as in CreateContent preview) */}
          <div className="content-preview text-gray-800 leading-relaxed text-[15px] md:text-base mb-6">
            <div dangerouslySetInnerHTML={renderHtml(caseStudy.content)} />
          </div>

          {/* Notes (if exists) */}
          {caseStudy.notes && (
            <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
              <strong className="block mb-1 text-gray-900 text-xs uppercase tracking-wide">
                Author Notes
              </strong>
              <p className="whitespace-pre-wrap">{caseStudy.notes}</p>
            </div>
          )}

          {/* Links Section (YouTube or normal) */}
          {caseStudy.links && caseStudy.links.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <LinkIcon size={20} className="mr-2" />
                Reference Links
              </h3>
              <div className="space-y-4">
                {caseStudy.links.map((link, idx) => {
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

                        {/* YouTube Embed */}
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

                  // Normal link
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

          {/* Documents Section */}
          {caseStudy.documents && caseStudy.documents.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FileText size={20} className="mr-2" />
                Attached Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {caseStudy.documents.map((doc, idx) => (
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
                      <Download size={14} className="mr-1.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Author Info Footer */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-6 md:px-8 md:py-7">
          <div className="flex items-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-semibold text-xl flex items-center justify-center mr-4">
              {(caseStudy.authorName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900">
                {caseStudy.authorName}
              </h3>
              <p className="text-sm text-gray-600">
                Author & Developer at CaseBlog
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {caseStudy.links?.length || 0} Links
              </div>
              <div className="text-xs text-gray-500">
                {caseStudy.documents?.length || 0} Documents
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyDetail;