import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function AiBadge() {
    return (
        <span className="pill pill-ai">
            <AutoAwesomeIcon sx={{ fontSize: 11 }} aria-hidden />
            Resumen IA
        </span>
    );
}
