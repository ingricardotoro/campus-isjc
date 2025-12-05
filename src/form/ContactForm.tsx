"use client"
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import ErrorMsg from './auth/ErrorMsg';
import { toast } from 'sonner';

interface FormData {
    firstName: string;
    email: string;
    subject?: string;
    message: string;
}

const ContactForm: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<FormData>();

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success('¡Mensaje enviado exitosamente!', {
                    description: 'Nos pondremos en contacto contigo pronto.',
                    duration: 5000,
                });
                reset(); // Limpiar el formulario
            } else {
                toast.error('Error al enviar el mensaje', {
                    description: result.error || 'Por favor, intenta nuevamente.',
                    duration: 5000,
                });
            }
        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            toast.error('Error de conexión', {
                description: 'No se pudo enviar el mensaje. Por favor, verifica tu conexión a internet.',
                duration: 5000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row gy-30">
                {/* Full Name */}
                <div className="col-md-12">
                    <div className="form-input-box">
                        <div className="form-input-title">
                            <label htmlFor="firstName">Nombre Completo<span>*</span></label>
                        </div>
                        <div className="form-input">
                            <input
                                {...register("firstName", { required: "Nombre Completo es requerido" })}
                                id="firstName"
                                type="text"
                                placeholder="Nombre Completo"
                            />
                              <ErrorMsg error={errors?.firstName?.message} />
                        </div>
                    </div>
                </div>

                {/* Email Address */}
                <div className="col-md-12">
                    <div className="form-input-box">
                        <div className="form-input-title">
                            <label htmlFor="email">Correo Electrónico<span>*</span></label>
                        </div>
                        <div className="form-input">
                            <input
                                {...register("email", {
                                    required: "Email es requerido",
                                    pattern: {
                                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                                        message: "Correo electrónico no válido",
                                    },
                                })}
                                id="email"
                                type="email"
                                placeholder="Dirección de correo electrónico"
                            />
                            <ErrorMsg error={errors?.email?.message} />
                        </div>
                    </div>
                </div>

                {/* Subject (Optional) */}
                <div className="col-md-12">
                    <div className="form-input-box">
                        <div className="form-input-title">
                            <label htmlFor="subject">Área de Interes</label>
                        </div>
                        <div className="form-input">
                            <input {...register("subject")} id="subject" type="text" placeholder="Consulta - Cita - Mensaje" />
                        </div>
                    </div>
                </div>

                {/* Message */}
                <div className="col-xxl-12">
                    <div className="form-input-box mb-15">
                        <div className="form-input-title">
                            <label htmlFor="message">Mensage<span>*</span></label>
                        </div>
                        <div className="form-input">
                            <textarea
                                {...register("message", { required: "Message es requerido" })}
                                id="message"
                                placeholder="Mensaje a enviar"
                            ></textarea>
                            <ErrorMsg error={errors?.message?.message} />
                        </div>
                    </div>

                    {/* Privacy Policy Checkbox */}
                   {/*  <div className="checkbox-option">
                        <input id="course-check-1" type="checkbox" />
                        <label htmlFor="course-check-1">
                            You agree to our friendly{" "}
                            <span className="text-border-highlights">
                                <Link href="/privacy-policy">privacy policy</Link>
                                <span className="theme-black h-1px bottom-0"></span>
                            </span>
                            .
                        </label>
                    </div> */}
                </div>

                {/* Submit Button */}
                <div className="col-xxl-12">
                    <div className="bd-contact-form-btn">
                        <button 
                            className="bd-btn btn-primary w-100" 
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
                                'Enviar'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default ContactForm;
