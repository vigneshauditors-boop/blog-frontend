import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  BookOpen,
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Link as LinkIcon,
  Upload,
  Bold,
  Heading1,
  Heading2,
  Highlighter,
  List
} from 'lucide-react';

/* ---------- YouTube helpers ---------- */
const getYouTubeId = (url) => {
  try {
    const u = new URL(url);

    // youtu.be/VIDEO_ID
    if (u.hostname.includes('youtu.be')) {
      return u.pathname.replace('/', '') || null;
    }

    // youtube.com/watch?v=VIDEO_ID
    const vParam = u.searchParams.get('v');
    if (vParam) return vParam;

    // youtube.com/embed/VIDEO_ID or other formats
    const parts = u.pathname.split('/');
    const last = parts[parts.length - 1];
    if (last && last !== 'watch') return last;

    return null;
  } catch {
    return null;
  }
};

const isYouTubeLink = (url) => !!getYouTubeId(url);

/* ---------- Component ---------- */
const CreateContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contentType, setContentType] = useState('case-study');
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'web-apps',
    tags: [],
    highlight: '',
    notes: '',
    links: [],      // { heading, url, caption }
    documents: []   // { originalName, fileName, url, size, mimetype }
  });

  const [tagInput, setTagInput] = useState('');
  const [linkForm, setLinkForm] = useState({
    heading: '',
    url: '',
    caption: ''
  });

  const [loading, setLoading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // editor UI state
  const [textColor, setTextColor] = useState('#111827');
  const [editorBg, setEditorBg] = useState('#ffffff');
  const contentRef = useRef(null);

  /* ---------- Form handlers ---------- */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagInputChange = (e) => setTagInput(e.target.value);

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // links
  const handleLinkChange = (e) => {
    const { name, value } = e.target;
    setLinkForm(prev => ({ ...prev, [name]: value }));
  };

  const addLink = () => {
    if (!linkForm.url.trim()) return;
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, { ...linkForm }]
    }));
    setLinkForm({ heading: '', url: '', caption: '' });
  };

  const removeLink = (index) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  // documents
  const handleDocsChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setDocUploading(true);
    setDocError('');

    try {
      const token = localStorage.getItem('token');
      const uploadedDocs = [];

      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);

        const res = await fetch('http://localhost:5000/api/uploads/docs', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to upload document');
        }
        uploadedDocs.push(data.file);
      }

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...uploadedDocs]
      }));
    } catch (err) {
      console.error('Doc upload error:', err);
      setDocError(err.message || 'Failed to upload documents');
    } finally {
      setDocUploading(false);
      e.target.value = '';
    }
  };

  /* ---------- Editor helpers ---------- */
  const applyAroundSelection = (before, after = before) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || 'your text';

    const newValue =
      value.slice(0, selectionStart) +
      before +
      selected +
      after +
      value.slice(selectionEnd);

    setFormData(prev => ({ ...prev, content: newValue }));

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = selectionStart + before.length;
      textarea.selectionEnd = selectionStart + before.length + selected.length;
    }, 0);
  };

  const makeBold = () => applyAroundSelection('<strong>', '</strong>');

  const makeHeading = (level) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || 'Heading text';
    const prefix = '#'.repeat(level) + ' ';
    const newValue =
      value.slice(0, selectionStart) +
      prefix +
      selected +
      value.slice(selectionEnd);
    setFormData(prev => ({ ...prev, content: newValue }));

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = selectionStart + prefix.length;
      textarea.selectionEnd =
        selectionStart + prefix.length + selected.length;
    }, 0);
  };

  const highlightText = () =>
    applyAroundSelection('<mark>', '</mark>');

  const colorText = () =>
    applyAroundSelection(`<span style="color:${textColor}">`, '</span>');

  const makeBulletList = () => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selected = value.slice(selectionStart, selectionEnd) || 'List item';

    const lines = selected.split('\n');
    const listHtml =
      '<ul>\n' +
      lines.map(line => `  <li>${line || 'Item'}</li>`).join('\n') +
      '\n</ul>';

    const newValue =
      value.slice(0, selectionStart) +
      listHtml +
      value.slice(selectionEnd);

    setFormData(prev => ({ ...prev, content: newValue }));

    setTimeout(() => {
      textarea.focus();
      const pos = selectionStart + listHtml.length;
      textarea.selectionStart = textarea.selectionEnd = pos;
    }, 0);
  };

  /* ---------- Submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const token = localStorage.getItem('token');
      const endpoint =
        contentType === 'case-study' ? '/api/case-studies' : '/api/blogs';

      // Send category for both case studies and blogs (blogs use GST and related categories)
      const payload = formData;

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setMessageType('success');
        setMessage(
          `${contentType === 'case-study' ? 'Case Study' : 'Blog Post'
          } created successfully!`
        );

        setFormData({
          title: '',
          description: '',
          content: '',
          category:
            categories[contentType]?.[0]?.value ||
            (contentType === 'case-study' ? 'web-apps' : 'gst'),
          tags: [],
          highlight: '',
          notes: '',
          links: [],
          documents: []
        });
        setTagInput('');
        setLinkForm({ heading: '', url: '', caption: '' });
        setPreviewMode(false);

        setTimeout(() => {
          navigate(contentType === 'case-study' ? '/case-studies' : '/blog');
        }, 2000);
      } else {
        setMessageType('error');
        setMessage(data.message || 'Failed to create content');
      }
    } catch (error) {
      console.error('Error creating content:', error);
      setMessageType('error');
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = {
    'case-study': [
      { value: 'gst', label: 'GST & Compliance' },
      { value: 'gst-registration', label: 'GST Registration' },
      { value: 'gst-returns', label: 'GST Returns & Filing' },
      { value: 'income-tax', label: 'Income Tax' },
      { value: 'business-registration', label: 'Business Registration' },
      { value: 'accounting', label: 'Accounting & Bookkeeping' },
      { value: 'compliance', label: 'Audit & Compliance' }
    ],
    blog: [
      { value: 'gst', label: 'GST & Compliance' },
      { value: 'gst-registration', label: 'GST Registration' },
      { value: 'gst-returns', label: 'GST Returns & Filing' },
      { value: 'income-tax', label: 'Income Tax' },
      { value: 'business-registration', label: 'Business Registration' },
      { value: 'accounting', label: 'Accounting & Bookkeeping' },
      { value: 'compliance', label: 'Audit & Compliance' }
    ]
  };

  // When switching content type, default category to the first option of that type
  React.useEffect(() => {
    const first = categories[contentType]?.[0]?.value;
    if (first) {
      setFormData(prev => ({ ...prev, category: first }));
    }
  }, [contentType]);

  const renderHtml = (html) => ({
    __html: (html || '').replace(/\n/g, '<br />')
  });

  /* ---------- JSX ---------- */
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-4 mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Create Content
                </h1>
                <p className="text-gray-600 text-sm">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Author
              </span>
              <button
                type="button"
                onClick={() => setPreviewMode(prev => !prev)}
                className={`px-4 py-2 text-xs rounded-lg border transition-colors ${previewMode
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
                  }`}
              >
                {previewMode ? 'Back to Edit' : 'Preview'}
              </button>
            </div>
          </div>

          {/* Content Type */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Choose Content Type
            </h2>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setContentType('case-study')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs md:text-sm transition-all duration-200 ${contentType === 'case-study'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <BookOpen size={18} />
                <span>Case Study</span>
              </button>
              <button
                type="button"
                onClick={() => setContentType('blog')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs md:text-sm transition-all duration-200 ${contentType === 'blog'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <FileText size={18} />
                <span>Blog Post</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center space-x-3 text-sm ${messageType === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
                }`}
            >
              {messageType === 'success' ? (
                <CheckCircle size={18} className="text-green-600" />
              ) : (
                <AlertCircle size={18} className="text-red-600" />
              )}
              <span>{message}</span>
            </div>
          )}
        </div>

        {/* PREVIEW MODE */}
        {previewMode ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:px-7 md:py-6">
            {/* Highlight */}
            {formData.highlight && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <strong className="block mb-1 text-xs uppercase tracking-wide">
                  Update / Highlight
                </strong>
                <span>{formData.highlight}</span>
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {formData.title || 'Your heading will appear here'}
            </h1>
            <p className="text-base md:text-lg text-gray-600 mb-3">
              {formData.description ||
                'Your short intro / sub heading will appear here.'}
            </p>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mb-4 border-b border-gray-200 pb-3">
              <span className="px-2 py-0.5 bg-gray-100 rounded-full font-medium">
                {contentType === 'case-study' ? 'Case Study' : 'Blog Post'}
              </span>
              {contentType === 'case-study' && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                  Category: {formData.category}
                </span>
              )}
              {formData.tags.length > 0 && (
                <span>
                  Tags:{' '}
                  {formData.tags.map((t, i) => (
                    <span key={i} className="inline-block ml-1">
                      #{t}
                    </span>
                  ))}
                </span>
              )}
            </div>

            {/* Main content (with bullets) */}
            <div className="content-preview text-gray-800 leading-relaxed text-[15px] md:text-base">
              <div dangerouslySetInnerHTML={renderHtml(formData.content)} />
            </div>

            {/* Notes */}
            {formData.notes && (
              <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-700">
                <strong className="block mb-1 text-gray-900 text-xs uppercase tracking-wide">
                  Author Notes
                </strong>
                <p className="whitespace-pre-wrap">{formData.notes}</p>
              </div>
            )}

            {/* Links (YouTube or normal) */}
            {formData.links.length > 0 && (
              <div className="mt-4">
                <h3 className="text-base font-semibold mb-2">
                  Reference Links
                </h3>

                <div className="space-y-3">
                  {formData.links.map((link, idx) => {
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

                          {/* Smaller YouTube player */}
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

                    // normal link
                    return (
                      <div
                        key={idx}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      >
                        <div className="font-medium text-gray-900">
                          {link.heading || 'Link'}
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
                          <div className="text-xs text-gray-500 mt-0.5">
                            {link.caption}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Docs */}
            {formData.documents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-base font-semibold mb-2">
                  Attached Documents
                </h3>
                <ul className="space-y-2 text-sm">
                  {formData.documents.map((doc, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2"
                    >
                      <span className="truncate mr-3">
                        {doc.originalName || doc.fileName}
                      </span>
                      <span className="text-xs text-gray-500">
                        (download from final page)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* EDIT MODE */
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-[320px,minmax(0,1fr)] gap-5 items-start">
              {/* LEFT PANEL */}
              <div className="space-y-4">
                {/* Basic info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Basic Info
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Heading (Title) *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Main headline of your article"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Sub heading / Short summary *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="One or two lines that summarize your content"
                      />
                    </div>
                  </div>
                </div>

                {/* Highlight & Notes */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Highlights & Notes
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="highlight"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Highlight (optional)
                      </label>
                      <textarea
                        id="highlight"
                        name="highlight"
                        value={formData.highlight}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-amber-200 rounded-md text-xs bg-amber-50/70 focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        placeholder="Important update or key takeaway shown in a colored box"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="notes"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Notes (optional)
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Author notes, context or reminders"
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Tags */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Category & Tags
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="category"
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Category *
                      </label>
                      {categories[contentType]?.length ? (
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {categories[contentType].map((category) => (
                            <option key={category.value} value={category.value}>
                              {category.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Category"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tags
                      </label>
                      <div className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={handleTagInputChange}
                          onKeyPress={(e) =>
                            e.key === 'Enter' && (e.preventDefault(), addTag())
                          }
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add a tag and press Enter"
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          className="px-3 py-1.5 bg-gray-800 text-white rounded-md text-xs hover:bg-gray-900"
                        >
                          Add
                        </button>
                      </div>
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {formData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] bg-blue-100 text-blue-800"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 text-blue-700 hover:text-blue-900"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Links & Attachments */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Links & Attachments
                  </h3>

                  {/* Links */}
                  <div className="space-y-2 mb-4">
                    <label className="block text-xs font-medium text-gray-700">
                      Reference Links (optional)
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        name="heading"
                        value={linkForm.heading}
                        onChange={handleLinkChange}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Link heading"
                      />
                      <input
                        type="url"
                        name="url"
                        value={linkForm.url}
                        onChange={handleLinkChange}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com or YouTube URL"
                      />
                      <input
                        type="text"
                        name="caption"
                        value={linkForm.caption}
                        onChange={handleLinkChange}
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Short caption (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addLink}
                      className="mt-2 inline-flex items-center px-3 py-1.5 bg-gray-800 text-white rounded-md text-xs hover:bg-gray-900"
                    >
                      <LinkIcon size={14} className="mr-1" />
                      Add Link
                    </button>

                    {formData.links.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {formData.links.map((link, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5"
                          >
                            <div className="flex-1 mr-2">
                              <div className="font-medium text-gray-800">
                                {link.heading || 'Link'}
                              </div>
                              <div className="truncate text-[11px] text-blue-600">
                                {link.url}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLink(idx)}
                              className="text-[11px] text-gray-500 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Documents */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Attach Documents
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="inline-flex items-center px-3 py-1.5 bg-gray-800 text-white rounded-md text-xs font-medium cursor-pointer hover:bg-gray-900">
                        <Upload size={14} className="mr-1" />
                        {docUploading ? 'Uploading...' : 'Upload'}
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleDocsChange}
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        />
                      </label>
                      {docError && (
                        <span className="text-[11px] text-red-600">
                          {docError}
                        </span>
                      )}
                    </div>
                    {formData.documents.length > 0 && (
                      <ul className="mt-2 space-y-1 text-[11px]">
                        {formData.documents.map((doc, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-2 py-1"
                          >
                            <span className="truncate mr-2">
                              {doc.originalName || doc.fileName}
                            </span>
                            <a
                              href={`http://localhost:5000${doc.url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Download
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT PANEL – MAIN EDITOR */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Main Content
                  </h2>
                  <div className="flex items-center flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={makeBold}
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100"
                      title="Bold"
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => makeHeading(1)}
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100"
                      title="Heading 1"
                    >
                      <Heading1 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => makeHeading(2)}
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100"
                      title="Heading 2"
                    >
                      <Heading2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={highlightText}
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100"
                      title="Highlight text"
                    >
                      <Highlighter size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={makeBulletList}
                      className="p-1.5 rounded-md border border-gray-200 hover:bg-gray-100"
                      title="Bullet list"
                    >
                      <List size={16} />
                    </button>

                    {/* Color */}
                    <div className="flex items-center space-x-1 ml-1">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-6 h-6 border border-gray-200 rounded cursor-pointer"
                        title="Text color"
                      />
                      <button
                        type="button"
                        onClick={colorText}
                        className="px-2 py-1 text-[11px] border border-gray-200 rounded-md hover:bg-gray-100"
                      >
                        Color
                      </button>
                    </div>

                    {/* BG swatches */}
                    <div className="hidden sm:flex items-center ml-2 space-x-1">
                      {['#ffffff', '#f9fafb', '#fff7ed'].map((bg) => (
                        <button
                          key={bg}
                          type="button"
                          onClick={() => setEditorBg(bg)}
                          style={{ backgroundColor: bg }}
                          className={`w-5 h-5 rounded border ${editorBg === bg
                              ? 'border-blue-500'
                              : 'border-gray-200'
                            }`}
                          title="Editor background"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 mb-2">
                  Use the toolbar to add headings, bold text, highlights, bullet
                  points and colored text. You can also insert simple HTML tags
                  like {'<strong>'}, {'<mark>'}, {'<ul><li>'} etc.
                </p>

                <textarea
                  ref={contentRef}
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={18}
                  style={{ backgroundColor: editorBg, color: '#111827' }}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm leading-relaxed"
                  placeholder={`Write your ${contentType === 'case-study' ? 'case study' : 'blog post'
                    } content here...`}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end mt-5">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 font-medium text-sm"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Save size={18} />
                )}
                <span>{loading ? 'Creating...' : 'Create Content'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateContent;
