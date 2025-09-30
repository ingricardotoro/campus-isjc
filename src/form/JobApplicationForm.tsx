"use client"
import React, { useState } from 'react';
import NiceSelect from '@/components/elements/nice-select/NiceSelect';

// Definir la interfaz Option para cumplir con el requisito de NiceSelect
interface Option {
    id: number;
    option: string;
    value?: string;
}

const JobApplicationForm = () => {
    // Estado para manejar la selección del área laboral
    const [selectedArea, setSelectedArea] = useState('');
    const selectHandler = (item: Option, name: string) => {
        if (name === 'areaLaboral') {
            setSelectedArea(item.value || '');
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
        { id: 2, option: 'Primaria', value: 'Docente de Primaria' },
        { id: 2, option: 'Matemáticas', value: 'Matemáticas' },
        { id: 3, option: 'Ciencias', value: 'Ciencias Naturales / Biología / Química' },
        { id: 4, option: 'Español', value: 'Español / Literatura' },
        { id: 5, option: 'Inglés', value: 'Inglés' },
        { id: 6, option: 'Estudios Sociales', value: 'Ciencias Sociales' },
        { id: 7, option: 'Artes', value: 'Artes / Música' },
        { id: 8, option: 'Educación Física', value: 'Educación Física' },
        { id: 9, option: 'Tecnología', value: 'Tecnología' },
        { id: 10, option: 'Religión', value: 'Religión' },
        { id: 11, option: 'Orientación', value: 'Orientación / Psicología' },
        { id: 11, option: 'Otro', value: 'Otro' },
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
        <form action="#" encType="multipart/form-data">
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
                                <button className="bd-btn btn-outline-primary w-100" type="submit">Enviar Aplicación</button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
    );
};

export default JobApplicationForm;