import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
// FIX: Import FileObject from local types to resolve module export error.
import { FileObject } from '../types';
import DeleteIcon from './icons/DeleteIcon';

const BUCKET_NAME = 'proof_images';
const BUCKET_NOT_FOUND_ERROR = `Depolama alanı ('${BUCKET_NAME}') bulunamadı. Lütfen Supabase projenizde '${BUCKET_NAME}' adında bir Storage bucket oluşturun ve herkese açık (public) erişime izin verin.`;
const RLS_ERROR_MESSAGE = `Veritabanı güvenlik kuralları (RLS) bu işlemi engelliyor.`;
const RLS_ERROR_INSTRUCTIONS_TITLE = "Yapılandırma Hatası: Veritabanı Güvenlik Kuralları";

const RLS_INSTRUCTIONS = (
    <div>
        <p className="text-sm mb-2">
            Veritabanı güvenlik kurallarınız (Row-Level Security), bu bölümün doğru çalışmasını engelliyor. Bu, Supabase projeleri için yaygın bir tek seferlik kurulum adımıdır.
        </p>
        <p className="text-sm font-semibold mb-2">
            Sorunu çözmek için lütfen aşağıdaki adımları izleyin:
        </p>
        <ol className="list-decimal list-inside text-sm space-y-1 mb-3">
            <li>Supabase projenizde 'SQL Editor' bölümüne gidin.</li>
            <li><strong>'New query'</strong> butonuna tıklayın.</li>
            <li>Aşağıdaki SQL betiğinin tamamını kopyalayıp yapıştırın ve <strong>'RUN'</strong> butonuna tıklayın. Bu betik, depolama alanı için gerekli tüm izinleri ayarlayacaktır.</li>
        </ol>
        <pre className="bg-red-200 text-red-900 p-3 rounded text-xs overflow-x-auto font-mono">
            <code>
{`-- Bu betik, '${BUCKET_NAME}' depolama alanınız için tüm güvenlik kurallarını ayarlar.
-- Eski kuralları güvenle kaldırır ve hem sizin yönetmenize hem de
-- ziyaretçilerin görselleri ana sayfada görmesine olanak tanır.

-- Önceki çakışan kuralları temizle
DROP POLICY IF EXISTS "Allow public read access for proof_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads for proof_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates for proof_images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes for proof_images" ON storage.objects;
-- Eski, daha genel isimlendirilmiş kuralları da temizleyelim
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;

-- 1. Ziyaretçilerin görselleri ana sayfada görmesi için herkese açık okuma izni ver
CREATE POLICY "Allow public read access for proof_images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = '${BUCKET_NAME}');

-- 2. Giriş yapmış kullanıcıların (admin) görsel yüklemesine izin ver
CREATE POLICY "Allow authenticated uploads for proof_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = '${BUCKET_NAME}');

-- 3. Giriş yapmış kullanıcıların (admin) bu depolama alanındaki herhangi bir görseli güncellemesine izin ver
CREATE POLICY "Allow authenticated updates for proof_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = '${BUCKET_NAME}');

-- 4. Giriş yapmış kullanıcıların (admin) bu depolama alanındaki herhangi bir görseli silmesine izin ver
CREATE POLICY "Allow authenticated deletes for proof_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = '${BUCKET_NAME}');`}
            </code>
        </pre>
    </div>
);


const ProofEditor: React.FC = () => {
    const [images, setImages] = useState<FileObject[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchImages = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        });

        if (error) {
            console.error("Error fetching images:", error);
            if (error.message.includes('Bucket not found')) {
                setError(BUCKET_NOT_FOUND_ERROR);
            } else if (error.message.includes('security policy')) {
                setError(RLS_ERROR_MESSAGE);
            } else {
                setError(`Görüntüler alınırken bir hata oluştu: ${error.message}`);
            }
            setImages([]);
        } else {
            setImages(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);

        const file = files[0];
        const fileName = `${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file);

        if (uploadError) {
            console.error("Upload error:", uploadError.message);
            if (uploadError.message.includes('Bucket not found')) {
                setError(BUCKET_NOT_FOUND_ERROR);
            } else if (uploadError.message.includes('violates row-level security policy')) {
                setError(RLS_ERROR_MESSAGE);
            } else {
                setError(`Görüntü yüklenirken hata oluştu: ${uploadError.message}`);
            }
        } else {
            await fetchImages(); // Refresh the list
        }

        setUploading(false);
        // Clear file input
        event.target.value = '';
    };

    const handleDelete = async (imageName: string) => {
        if (!window.confirm("Bu görüntüyü silmek istediğinizden emin misiniz?")) return;

        setError(null);
        const { error: deleteError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([imageName]);

        if (deleteError) {
            console.error("Delete error:", deleteError.message);
             if (deleteError.message.includes('Bucket not found')) {
                setError(BUCKET_NOT_FOUND_ERROR);
            } else if (deleteError.message.includes('violates row-level security policy')) {
                setError(RLS_ERROR_MESSAGE);
            } else {
                setError(`Görüntü silinirken hata oluştu: ${deleteError.message}`);
            }
        } else {
            setImages(prevImages => prevImages.filter(img => img.name !== imageName));
        }
    };

    const getImageUrl = (imageName: string) => {
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imageName);
        return data.publicUrl;
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">Kanıt Görüntüleri</h2>
                <label htmlFor="proof-upload" className={`px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    {uploading ? 'Yükleniyor...' : 'Yeni Yükle'}
                </label>
                <input
                    id="proof-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                />
            </div>
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-md mb-4" role="alert">
                    <p className="font-bold">{error === RLS_ERROR_MESSAGE ? RLS_ERROR_INSTRUCTIONS_TITLE : 'Yapılandırma Hatası'}</p>
                    {error === BUCKET_NOT_FOUND_ERROR ? (
                        <div>
                            <p className="text-sm mb-2">{`Depolama alanı ('${BUCKET_NAME}') bulunamadı. Bu özelliği kullanmak için lütfen projenizde bir Storage Bucket oluşturun.`}</p>
                            <ol className="list-decimal list-inside text-sm space-y-1">
                                <li>Supabase projenizde 'Storage' bölümüne gidin.</li>
                                <li><strong>'New Bucket'</strong> butonuna tıklayın.</li>
                                <li>Bucket adı olarak <code className="bg-red-200 text-red-900 px-1 py-0.5 rounded text-xs">{BUCKET_NAME}</code> girin.</li>
                                <li>Bu bucket'ı <strong>'Public'</strong> olarak ayarlayın.</li>
                            </ol>
                            <a href="https://supabase.com/docs/guides/storage/buckets/creating-buckets" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-red-900 hover:underline mt-3 inline-block">
                                Adım adım kılavuz için tıklayın &rarr;
                            </a>
                        </div>
                    ) : error === RLS_ERROR_MESSAGE ? (
                        RLS_INSTRUCTIONS
                    ) : (
                        <p className="text-sm">{error}</p>
                    )}
                </div>
            )}
            {loading ? (
                <div className="text-center py-4 text-slate-500">Yükleniyor...</div>
            ) : images.length === 0 && !error ? (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                    <p>Henüz kanıt görüntüsü yüklenmemiş.</p>
                    <p className="text-sm">Başlamak için "Yeni Yükle" düğmesini kullanın.</p>
                </div>
            ) : (
                <div className="custom-scrollbar flex overflow-x-auto gap-6 pb-4 -mb-4">
                    {images.map(image => (
                        <div key={image.id} className="relative group aspect-video w-80 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200">
                            <img
                                src={getImageUrl(image.name)}
                                alt="Proof"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(image.name)}
                                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                    aria-label="Görüntüyü sil"
                                >
                                    <DeleteIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProofEditor;