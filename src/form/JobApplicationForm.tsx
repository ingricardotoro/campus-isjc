"use client"
import React, { useState } from 'react';
import NiceSelect from '@/components/elements/nice-select/NiceSelect';
import { toast } from 'sonner';

// Definir la interfaz Option para cumplir con el requisito de NiceSelect
interface Option {
    id: number;
    option: string;
    value?: string;
}

const JobApplicationForm = () => {
    // Estados para manejar la selección y el envío
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedEnglish, setSelectedEnglish] = useState('');
    const [selectedSpecialization, setSelectedSpecialization] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const selectHandler = (item: Option, name: string) => {
        if (name === 'areaLaboral') {
            setSelectedArea(item.value || '');
        } else if (name === 'nivelIngles') {
            setSelectedEnglish(item.value || '');
        } else if (name === 'especializacion') {
            setSelectedSpecialization(item.value || '');
        }
    };

    // Manejar el envío del formulario
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const fileInput = formData.get('curriculum') as File;

        // Validar que se haya seleccionado un área laboral
        if (!selectedArea) {
            toast.error('Por favor selecciona un área laboral');
            setIsSubmitting(false);
            return;
        }

        // Validar que se haya seleccionado nivel de inglés
        if (!selectedEnglish) {
            toast.error('Por favor selecciona tu nivel de inglés');
            setIsSubmitting(false);
            return;
        }

        // Validar que se haya adjuntado un CV
        if (!fileInput || fileInput.size === 0) {
            toast.error('Por favor adjunta tu Curriculum Vitae en formato PDF');
            setIsSubmitting(false);
            return;
        }

        // Validar que sea un archivo PDF
        if (fileInput.type !== 'application/pdf') {
            toast.error('El CV debe estar en formato PDF');
            setIsSubmitting(false);
            return;
        }

        // Validar tamaño del archivo (máximo 5MB)
        if (fileInput.size > 5 * 1024 * 1024) {
            toast.error('El CV no debe superar los 5MB');
            setIsSubmitting(false);
            return;
        }

        // Convertir el archivo a base64
        let fileBase64 = '';
        try {
            const fileBuffer = await fileInput.arrayBuffer();
            const base64 = Buffer.from(fileBuffer).toString('base64');
            fileBase64 = base64;
        } catch (error) {
            console.error('Error al procesar el archivo:', error);
            toast.error('Error al procesar el archivo CV');
            setIsSubmitting(false);
            return;
        }

        // Preparar datos para enviar
        const applicationData = {
            nombreCompleto: formData.get('nombreCompleto'),
            telefono: formData.get('telefono'),
            correo: formData.get('correo'),
            direccion: formData.get('direccion'),
            nivelIngles: selectedEnglish,
            areaLaboral: selectedArea,
            especializacion: selectedSpecialization || undefined,
            experiencia: formData.get('experiencia'),
            curriculumFileName: fileInput.name,
            curriculumFileContent: fileBase64,
        };

        try {
            const response = await fetch('/api/job-application', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(applicationData),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('¡Aplicación enviada exitosamente!', {
                    description: 'Revisaremos tu aplicación y nos pondremos en contacto pronto.',
                    duration: 5000,
                });
                // Limpiar el formulario
                form.reset();
                setSelectedArea('');
                setSelectedEnglish('');
                setSelectedSpecialization('');
            } else {
                toast.error('Error al enviar la aplicación', {
                    description: result.error || 'Por favor, intenta nuevamente.',
                    duration: 5000,
                });
            }
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            toast.error('Error de conexión', {
                description: 'No se pudo enviar la aplicación. Por favor, verifica tu conexión a internet.',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Opciones para el área laboral
    const jobAreas: Option[] = [
        { id: 1, option: 'Seleccione un área', value: '' },
        { id: 2, option: 'Docencia', value: 'Docencia' },
        { id: 3, option: 'Administración', value: 'Administración' },
        { id: 4, option: 'Tecnología de la Información (TI)', value: 'Tecnología de la Información (TI)' },
        { id: 5, option: 'Mantenimiento', value: 'Mantenimiento' },
        { id: 6, option: 'Otro', value: 'Otro' },
    ];

    // Opciones para especialización docente (solo se muestra si se selecciona docencia)
    const teachingSpecializations: Option[] = [
        { id: 1, option: 'Seleccione una especialización', value: '' },
        { id: 2, option: 'Prebásica', value: 'Docente de Prebásica' },
        { id: 3, option: 'Primaria', value: 'Docente de Primaria' },
        { id: 4, option: 'Matemáticas', value: 'Matemáticas' },
        { id: 5, option: 'Ciencias', value: 'Ciencias Naturales / Biología / Química' },
        { id: 6, option: 'Español', value: 'Español / Literatura' },
        { id: 7, option: 'Inglés', value: 'Inglés' },
        { id: 8, option: 'Estudios Sociales', value: 'Ciencias Sociales' },
        { id: 9, option: 'Artes', value: 'Artes / Música' },
        { id: 10, option: 'Educación Física', value: 'Educación Física' },
        { id: 11, option: 'Tecnología', value: 'Tecnología' },
        { id: 12, option: 'Religión', value: 'Religión' },
        { id: 13, option: 'Orientación', value: 'Orientación / Psicología' },
        { id: 14, option: 'Otro', value: 'Otro' },
    ];

    // Opciones para nivel de inglés
    const englishLevels: Option[] = [
        { id: 1, option: 'Seleccione un nivel', value: '' },
        { id: 2, option: 'Nativo', value: 'Nativo' },
        { id: 3, option: 'Avanzado', value: 'Avanzado' },
        { id: 4, option: 'Intermedio', value: 'Intermedio' },
        { id: 5, option: 'Básico', value: 'Básico' },
        { id: 6, option: 'Ninguno', value: 'Ninguno' },
    ];

    return (
        <form onSubmit={handleSubmit} encType="multipart/form-data">
            <div className="row gy-30">
                <div className="col-12">
                    <h4 className="form-section-title mb-4">1. Información Personal</h4>
                </div>
                
                {/* Nombre completo */}
                <div className="col-md-6">
                    <div className="form-input-box">
                        <div className="form-input-title">
                            <label htmlFor="nombreCompleto" data-error="wrong" data-success="right">Nombre Completo <span className="text-danger">*</span></label>
                        </div>
                        <div className="form-input">
                            <input 
                                name="nombreCompleto" 
                                id="nombreCompleto" 
                                type="text" 
                                placeholder="Ingrese su nombre completo" 
                                required 
                            />
                        </div>
                    </div>
                </div>

                {/* Teléfono */}
                <div className="col-md-6">
                    <div className="form-input-box">
                        <div className="form-input-title">
                            <label htmlFor="telefono" data-error="wrong" data-success="right">Teléfono <span className="text-danger">*</span></label>
                        </div>
                        <div className="form-input">
                            <input 
                                name="telefono" 
                                id="telefono" 
                                type="tel" 
                                placeholder="Ej. +504 9999-9999" 
                                required 
                            />
                        </div>
                    </div>
                </div>

                {/* Correo electrónico */}
                <div className="col-md-6">
                    <div className="form-input-box">
                        <div className="form-input-title">
                            <label htmlFor="correo" data-error="wrong" data-success="right">Correo Electrónico <span className="text-danger">*</span></label>
                        </div>
                        <div className="form-input">
                            <input 
                                name="correo" 
                                id="correo" 
                                type="email" 
                                placeholder="ejemplo@correo.com" 
                                required 
                            />
                        </div>
                    </div>
                </div>

                {/* Dirección */}
                <div className="col-md-6">
                    <div className="form-input-box">
                        <div className="form-input-title">
                            <label htmlFor="direccion" data-error="wrong" data-success="right">Dirección de Residencia <span className="text-danger">*</span></label>
                        </div>
                        <div className="form-input">
                            <input 
                                name="direccion" 
                                id="direccion" 
                                type="text" 
                                placeholder="Ingrese su dirección completa" 
                                required 
                            />
                        </div>
                    </div>
                </div>

                {/* Nivel de inglés */}
                <div className="col-md-6">
                    <div className="form-input-box">
                        <div className="form-input-title">
                            <label htmlFor="nivelIngles" data-error="wrong" data-success="right">¿Es bilingüe? (Nivel de Inglés) <span className="text-danger">*</span></label>
                        </div>
                        <div className="form-input">
                            <div className="form-select-option">
                                <NiceSelect
                                    options={englishLevels}
                                    defaultCurrent={0}
                                    onChange={selectHandler}
                                    name="nivelIngles"
                                    className="job-select"
                                    filterIcon={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12">
                    <div className="bd-form-divider mt-3 mb-3"></div>
                    <h4 className="form-section-title mb-4">2. Información Laboral</h4>
                </div>

                {/* Área laboral */}
                <div className="col-md-6">
                    <div className="form-input-box">
                        <div className="form-input-title">
                            <label htmlFor="areaLaboral" data-error="wrong" data-success="right">Área Laboral a la que Aplica <span className="text-danger">*</span></label>
                        </div>
                        <div className="form-input">
                            <div className="form-select-option">
                                <NiceSelect
                                    options={jobAreas}
                                    defaultCurrent={0}
                                    onChange={selectHandler}
                                    name="areaLaboral"
                                    className="job-select"
                                    filterIcon={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Especialización docente (solo si selecciona docencia) */}
                {selectedArea === 'Docencia' && (
                    <div className="col-md-6">
                        <div className="form-input-box">
                            <div className="form-input-title">
                                <label htmlFor="especializacion" data-error="wrong" data-success="right">Área de Especialización <span className="text-danger">*</span></label>
                            </div>
                            <div className="form-input">
                                <div className="form-select-option">
                                    <NiceSelect
                                        options={teachingSpecializations}
                                        defaultCurrent={0}
                                        onChange={selectHandler}
                                        name="especializacion"
                                        className="job-select"
                                        filterIcon={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                    <div className="col-12">
                        <div className="bd-form-divider mt-3 mb-3"></div>
                        <h4 className="form-section-title mb-4">3. Experiencia y Documentación</h4>
                    </div>

                    {/* Adjuntar CV */}
                    <div className="col-md-6">
                        <div className="form-input-box">
                            <div className="form-input-title">
                                <label htmlFor="curriculum" data-error="wrong" data-success="right">Adjuntar Curriculum Vitae (PDF) <span className="text-danger">*</span></label>
                            </div>
                            <div className="form-input mb-10">
                                <input 
                                    name="curriculum" 
                                    id="curriculum" 
                                    type="file" 
                                    accept=".pdf" 
                                    required 
                                />
                            </div>
                            <em>Solo se admiten archivos en formato PDF. Tamaño máximo: 5MB.</em>
                        </div>
                    </div>

                    {/* Experiencia laboral */}
                    <div className="col-md-12 mt-4">
                        <div className="form-input-box">
                            <div className="form-input-title">
                                <label htmlFor="experiencia" data-error="wrong" data-success="right">Describa brevemente su experiencia laboral en el área que aplica <span className="text-danger">*</span></label>
                            </div>
                            <div className="form-input">
                                <textarea 
                                    name="experiencia" 
                                    id="experiencia" 
                                    rows={5} 
                                    placeholder="Describa su experiencia profesional, logros y responsabilidades relevantes para el puesto..." 
                                    required
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="bd-form-divider"></div>
                        <div className="bd-apply-declaration">
                            <h3 className="bd-course-details-content-title">Declaración</h3>
                            <div className="checkout-option">
                                <input id="declaracion" type="checkbox" required />
                                <label htmlFor="declaracion">
                                    Declaro que toda la información proporcionada en este formulario es verídica y autorizo a la institución a verificar los datos proporcionados.
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-xl-5">
                            <div className="bd-apply-submit-btn mt-50">
                                <button 
                                    className="bd-btn btn-outline-primary w-100" 
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                                            {' '}
                                            Enviando...
                                        </>
                                    ) : (
                                        'Enviar Aplicación'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
    );
};

export default JobApplicationForm;