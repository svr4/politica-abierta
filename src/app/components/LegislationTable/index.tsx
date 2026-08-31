import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import TablePagination from '@mui/material/TablePagination';
import SearchIcon from '@mui/icons-material/Search';

import StatusBadge from '../StatusBadge';
import LiveRegion from '../Misc/LiveRegion';
import { Legislation, LegislationFilter } from '../../lib/models';
import { useAppDispatch, useAppSelector } from '../../lib/hooks';
import { selectCommittees, updateLegislationFilter } from '../../lib/slices/appConfig';
import {
    formatBillNo,
    formatShortDate,
    getChamberFromCommittee,
    getCommitteeName,
} from '../../lib/legislationMeta';
import { ROUTE_TITLES, setDocumentTitle } from '../../lib/pageTitles';
import data from '../../lib/data';

const emptyFilter: LegislationFilter = {
    searchText: '',
    committee: -1,
    chamber: '',
    status: '',
};

interface LegislationStats {
    total: number;
    enComision: number;
    aprobados: number;
}

function formatCount(n: number): string {
    return n.toLocaleString('es-PR');
}

export default function LegislationTablePage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const committees = useAppSelector(selectCommittees);
    const storedFilter = useAppSelector((s) => s.appConfig.legislationFilters);

    const [filter, setFilter] = useState<LegislationFilter>({ ...emptyFilter, ...storedFilter });
    const [searchDraft, setSearchDraft] = useState(filter.searchText || '');
    const [rows, setRows] = useState<Legislation[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<LegislationStats>({ total: 0, enComision: 0, aprobados: 0 });

    useEffect(() => {
        setDocumentTitle(ROUTE_TITLES.legislation);
    }, []);

    useEffect(() => {
        (async () => {
            const base: LegislationFilter = { ...emptyFilter };
            const [all, comision, aprobado] = await Promise.all([
                window.imparcialAPI.getLegislations(1, 1, base),
                window.imparcialAPI.getLegislations(1, 1, { ...base, status: 'enComision' }),
                window.imparcialAPI.getLegislations(1, 1, { ...base, status: 'aprobado' }),
            ]);
            setStats({
                total: all.Data?.Pagination.Total ?? 0,
                enComision: comision.Data?.Pagination.Total ?? 0,
                aprobados: aprobado.Data?.Pagination.Total ?? 0,
            });
        })();
    }, []);

    const load = useCallback(async (f: LegislationFilter, p: number, limit: number) => {
        setLoading(true);
        dispatch(updateLegislationFilter(f));
        const result = await window.imparcialAPI.getLegislations(p + 1, limit, f);
        if (!result.Error && result.Data) {
            setRows(result.Data.Legislation);
            setTotal(result.Data.Pagination.Total);
        } else {
            setRows([]);
            setTotal(0);
        }
        setLoading(false);
    }, [dispatch]);

    useEffect(() => {
        load(filter, page, rowsPerPage);
    }, [filter, page, rowsPerPage, load]);

    function applyFilterPatch(patch: Partial<LegislationFilter>) {
        setPage(0);
        setFilter((prev) => ({ ...prev, ...patch }));
    }

    const committeeOptions = committees.length > 0
        ? committees
        : data.comisions.map((c) => ({ CommitteeId: c.id, AdministrationId: 2025, NotifyOnNewLegislation: false, NotificationFilters: [] }));

    return (
        <Box>
            <LiveRegion message={loading ? 'Cargando legislación…' : `${total} proyectos`} />

            <h1 className="page-title">Legislación</h1>
            <p className="page-subtitle">Base de datos legislativa actualizada diariamente</p>

            <div className="stat-row">
                <div className="stat-box">
                    <div className="stat-num">{formatCount(stats.total)}</div>
                    <div className="stat-label">Proyectos totales</div>
                </div>
                <div className="stat-box">
                    <div className="stat-num">{formatCount(stats.enComision)}</div>
                    <div className="stat-label">En comisión</div>
                </div>
                <div className="stat-box">
                    <div className="stat-num">{formatCount(stats.aprobados)}</div>
                    <div className="stat-label">Aprobados</div>
                </div>
            </div>

            <div className="filter-bar" role="search" aria-label="Filtros de legislación" style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--pa-bg-alt)', padding: '12px 0', marginBottom: 12 }}>
                <select
                    className="select-input"
                    value={filter.chamber || ''}
                    onChange={(e) => applyFilterPatch({ chamber: e.target.value })}
                    aria-label="Cámara"
                >
                    <option value="">Cámara: Todas</option>
                    <option value="Senado">Senado</option>
                    <option value="Camara">Cámara de Representantes</option>
                    <option value="Conjunta">Conjunta</option>
                </select>
                <select
                    className="select-input"
                    value={filter.status || ''}
                    onChange={(e) => applyFilterPatch({ status: e.target.value })}
                    aria-label="Estado"
                >
                    <option value="">Estado: Todos</option>
                    <option value="radicado">Radicado</option>
                    <option value="enComision">En comisión</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                    <option value="ley">Firmado / Ley</option>
                </select>
                <select
                    className="select-input"
                    value={filter.committee}
                    onChange={(e) => applyFilterPatch({ committee: Number(e.target.value) })}
                    aria-label="Comisión"
                >
                    <option value={-1}>Comisión: Todas</option>
                    {committeeOptions.map((c) => (
                        <option key={c.CommitteeId} value={c.CommitteeId}>
                            {getCommitteeName(c.CommitteeId)}
                        </option>
                    ))}
                </select>
                <div className="search-box" style={{ flex: 1, minWidth: 180 }}>
                    <SearchIcon fontSize="small" aria-hidden />
                    <input
                        type="text"
                        placeholder="Buscar por número o título"
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                applyFilterPatch({ searchText: searchDraft });
                            }
                        }}
                        onBlur={() => applyFilterPatch({ searchText: searchDraft })}
                        aria-label="Buscar por número o título"
                    />
                </div>
            </div>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress aria-hidden />
                </Box>
            ) : (
                <>
                    <div className="table-wrap">
                        <table className="data-table" aria-label="Tabla de legislación">
                            <thead>
                                <tr>
                                    <th style={{ width: 70 }}>No.</th>
                                    <th>Título</th>
                                    <th style={{ width: 140 }}>Autor</th>
                                    <th style={{ width: 130 }}>Estado</th>
                                    <th style={{ width: 90 }}>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>No hay proyectos con estos filtros.</td>
                                    </tr>
                                ) : (
                                    rows.map((row) => {
                                        const chamber = getChamberFromCommittee(row.Committe);
                                        const billNo = formatBillNo(chamber, row.Number);
                                        return (
                                            <tr
                                                key={row.Hash}
                                                onClick={() => navigate(`/legislacion/${row.Hash}`)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        navigate(`/legislacion/${row.Hash}`);
                                                    }
                                                }}
                                                tabIndex={0}
                                                role="link"
                                            >
                                                <td className="bill-id">{billNo}</td>
                                                <td className="truncate">{row.Title}</td>
                                                <td>{row.Author}</td>
                                                <td><StatusBadge raw={row.LastEvent} /></td>
                                                <td>{formatShortDate(row.FiledDate)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[10, 25, 50]}
                        labelRowsPerPage="Filas"
                    />
                </>
            )}
        </Box>
    );
}
