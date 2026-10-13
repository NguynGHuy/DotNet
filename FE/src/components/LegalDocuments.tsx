import { useState } from "react";
import { CheckCircle2, FileText, Upload } from "lucide-react";
import {
    uploadLegalDocument,
    downloadLegalDocument,
} from "../services/legalProfileService";
import type { LegalDocumentType } from "../services/legalProfileService";

interface Props {
    businessFile: string | null;
    representativeFile: string | null;
    canEdit: boolean;
    disabled: boolean;
    onBusyChange: (busy: boolean) => void;
}

const DOCUMENTS: {
    type: LegalDocumentType;
    title: string;
    description: string;
}[] = [
        {
            type: "giay-phep",
            title: "Giấy phép kinh doanh",
            description: "Tệp giấy phép của hộ kinh doanh hoặc doanh nghiệp.",
        },
        {
            type: "giay-to",
            title: "Giấy tờ người đại diện",
            description: "Tệp CCCD hoặc giấy tờ của người đại diện.",
        },
    ];

function LegalDocuments({
    businessFile,
    representativeFile,
    canEdit,
    disabled,
    onBusyChange,
}: Props) {
    const [files, setFiles] = useState<
        Record<LegalDocumentType, File | null>
    >({
        "giay-phep": null,
        "giay-to": null,
    });

    const [uploaded, setUploaded] = useState<
        Partial<Record<LegalDocumentType, string>>
    >({});

    const [busyType, setBusyType] = useState<LegalDocumentType | null>(null);
    const [downloadingType, setDownloadingType] = useState<LegalDocumentType | null>(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const busy = busyType !== null;

    const handleUpload = async (type: LegalDocumentType) => {
        const file = files[type];
        if (!file || busy || disabled || !canEdit) return;

        setError("");
        setMessage("");

        if (file.size > 5 * 1024 * 1024) {
            setError("Dung lượng tệp không được vượt quá 5 MB.");
            return;
        }

        if (!/\.(pdf|png|jpe?g)$/i.test(file.name)) {
            setError("Chỉ hỗ trợ PDF, JPG, JPEG hoặc PNG.");
            return;
        }

        try {
            setBusyType(type);
            onBusyChange(true);

            const result = await uploadLegalDocument(type, file);
            setUploaded((previous) => ({
                ...previous,
                [type]: result.tep,
            }));

            setFiles((previous) => ({
                ...previous,
                [type]: null,
            }));

            setMessage(
                type === "giay-phep"
                    ? "Đã tải giấy phép kinh doanh lên."
                    : "Đã tải giấy tờ người đại diện lên."
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không tải được giấy tờ lên."
            );
        } finally {
            setBusyType(null);
            onBusyChange(false);
        }
    };

    const handleDownload = async (type: LegalDocumentType) => {
        if (downloadingType !== null || busy) return;

        try {
            setDownloadingType(type);
            setError("");
            await downloadLegalDocument(type);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Không tải được giấy tờ."
            );
        } finally {
            setDownloadingType(null);
        }
    };

    return (
        <section className="merchant-info-section">
            <div className="merchant-info-section-title">
                <FileText size={18} />
                <div>
                    <h2>Giấy tờ đính kèm</h2>
                    <p>Hỗ trợ PDF, JPG, JPEG, PNG — tối đa 5 MB mỗi tệp.</p>
                </div>
            </div>

            {message && (
                <div className="merchant-info-notice success" role="status">
                    <CheckCircle2 size={17} />
                    {message}
                </div>
            )}

            {error && (
                <div className="merchant-info-notice error" role="alert">
                    {error}
                </div>
            )}

            <div className="merchant-legal-documents">
                {DOCUMENTS.map((document) => {
                    const storedFile =
                        uploaded[document.type] ??
                        (document.type === "giay-phep"
                            ? businessFile
                            : representativeFile);

                    return (
                        <div
                            className="merchant-legal-document"
                            key={document.type}
                        >
                            <div className="merchant-legal-document-heading">
                                <strong>{document.title}</strong>
                                <span className={storedFile ? "is-uploaded" : ""}>
                                    {storedFile ? "Đã có tệp" : "Chưa tải lên"}
                                </span>
                            </div>

                            <p>{document.description}</p>

                            {storedFile && (
                                <button
                                    type="button"
                                    className="merchant-legal-download"
                                    disabled={downloadingType !== null || busy}
                                    onClick={() => void handleDownload(document.type)}
                                >
                                    <FileText size={16} />
                                    {downloadingType === document.type
                                        ? "Đang tải..."
                                        : "Tải tệp đã lưu"}
                                </button>
                            )}

                            {canEdit && (
                                <>
                                    <label className="merchant-legal-file-picker">
                                        <Upload size={17} />
                                        <span>
                                            {files[document.type]?.name ??
                                                (storedFile
                                                    ? "Chọn tệp thay thế"
                                                    : "Chọn tệp")}
                                        </span>

                                        <input
                                            key={`${document.type}-${uploaded[document.type] ?? ""}`}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            aria-label={`Chọn ${document.title.toLowerCase()}`}
                                            disabled={busy || disabled}
                                            onChange={(event) => {
                                                const selected =
                                                    event.target.files?.[0] ?? null;

                                                setFiles((previous) => ({
                                                    ...previous,
                                                    [document.type]: selected,
                                                }));
                                                setError("");
                                                setMessage("");
                                            }}
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        className="merchant-info-save"
                                        disabled={
                                            busy ||
                                            disabled ||
                                            !files[document.type]
                                        }
                                        onClick={() =>
                                            void handleUpload(document.type)
                                        }
                                    >
                                        <Upload size={16} />
                                        {busyType === document.type
                                            ? "Đang tải..."
                                            : "Tải lên"}
                                    </button>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default LegalDocuments;