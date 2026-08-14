import Swal from 'sweetalert2';

const isDark = () =>
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

export async function confirmDelete(text: string, title = 'Tem certeza?'): Promise<boolean> {
    const result = await Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6366f1',
        reverseButtons: true,
        background: isDark() ? '#1f2937' : '#ffffff',
        color: isDark() ? '#f3f4f6' : '#111827',
    });

    return result.isConfirmed;
}

export function showToast(text: string, icon: 'info' | 'success' | 'error' = 'info') {
    Swal.fire({
        text,
        icon,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: isDark() ? '#1f2937' : '#ffffff',
        color: isDark() ? '#f3f4f6' : '#111827',
    });
}
