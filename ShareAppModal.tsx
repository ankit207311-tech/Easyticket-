import React, { useState } from 'react';
import { Check, Copy, MessageCircle, Share2, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { buildWhatsAppShareUrl } from '../lib/whatsapp';

interface ShareAppModalProps {
  onClose: () => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({ onClose }) => {
  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-brand-600" />
            <h2 className="text-base font-extrabold text-slate-900">Share Easy Ticket</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center text-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <QRCodeSVG value={currentUrl || 'https://mahaveer-easy-ticket.web.app'} size={160} />
          </div>
          <p className="mt-3 text-xs font-medium text-slate-600">
            Passengers can scan this QR code on Android or iPhone to open Mahaveer Travels Easy Ticket directly in their browser.
          </p>

          <div className="mt-4 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-slate-700">
              {currentUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <a
            href={buildWhatsAppShareUrl(currentUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500"
          >
            <MessageCircle className="h-4 w-4" />
            Share Link on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
