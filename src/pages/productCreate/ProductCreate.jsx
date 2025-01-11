import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { toast } from "@/hooks/use-toast"
import { FormNavigation } from './_components/form-navigation'
import { BasicDetails } from './_components/basic-details'
import { Categorization } from './_components/categorization'
import { Specifications } from './_components/specifications'
import { TargetAudience } from './_components/target-audience'
import { StatusVisibility } from './_components/status-visibility'
import { SEO } from './_components/seo'
import { ImageUpload } from './_components/image-upload'
import { Variants } from './_components/variants'
import { useCreateProductPost } from '@/features/products/hooks/useProducts'

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().max(200, "Short description cannot exceed 200 characters").optional(),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  shop: z.string().min(1, "Shop is required"),
  specifications: z.object({
    material: z.string().optional(),
    weaveType: z.string().optional(),
    craftTechnique: z.string().optional(),
    careInstructions: z.string().optional(),
    fabricCount: z.string().optional(),
    borderType: z.string().optional(),
    borderWidth: z.string().optional(),
    palluDetails: z.string().optional(),
    threadCount: z.number().optional(),
    zariType: z.string().optional(),
  }),
  gender: z.enum(['Male', 'Female', 'Unisex']),
  ageGroup: z.enum(['Adult', 'Kids', 'All']),
  status: z.enum(['draft', 'published', 'archived']),
  isVisible: z.boolean(),
  metaTitle: z.string().max(60, "Meta title should not exceed 60 characters").optional(),
  metaDescription: z.string().max(160, "Meta description should not exceed 160 characters").optional(),
  keywords: z.array(z.string()).optional(),
  variants: z.array(z.object({
    color: z.object({
      name: z.string().min(1, "Color name is required"),
      code: z.string().optional(),
      description: z.string().optional(),
    }),
    pattern: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
    }),
    size: z.object({
      value: z.string().min(1, "Size value is required"),
      measurements: z.object({
        length: z.object({
          value: z.number(),
          unit: z.enum(['cm', 'inches', 'meters']),
        }),
        width: z.object({
          value: z.number(),
          unit: z.enum(['cm', 'inches', 'meters']),
        }),
      }),
      sizeChart: z.string().optional(),
    }),
    price: z.object({
      basePrice: z.number().min(0, "Price cannot be negative"),
      discount: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%"),
    }),
    stock: z.object({
      quantity: z.number().min(0, "Stock quantity must be non-negative"),
      status: z.enum(['in_stock', 'out_of_stock', 'low_stock']),
    }),
    isActive: z.boolean(),
    showInCarousel: z.boolean(),
    certifications: z.array(z.object({
      name: z.string(),
      certificateNumber: z.string(),
      issuedBy: z.string(),
      validUntil: z.date(),
    })).optional(),
    geographicIndication: z.object({
      region: z.string().optional(),
      state: z.string().optional(),
      isGICertified: z.boolean().optional(),
    }).optional(),
  })).optional(),
})

export function ProductCreate() {
  const [baseImage, setBaseImage] = useState(null);
  const [variantImages, setVariantImages] = useState({});
  const [currentStep, setCurrentStep] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: createProduct } = useCreateProductPost();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: 'Unisex',
      ageGroup: 'Adult',
      status: 'published',
      isVisible: true,
      variants: [],
    },
  })

  async function onSubmit(values) {
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData()
      
      // Append basic fields
      for (const [key, value] of Object.entries(values)) {
        if (key !== 'variants' && key !== 'specifications') {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'object' && value !== null) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value);
          }
        }
      }

      // Append specifications if they exist
      if (values.specifications) {
        formData.append('specifications', JSON.stringify(values.specifications));
      }

      // Append base image
      if (baseImage) {
        formData.append('baseImage', baseImage);
      }

      // Process variants and their images
      if (values.variants?.length) {
        const processedVariants = values.variants.map((variant, index) => {
          const variantCopy = { ...variant, id: index+1 };
          if (variantImages[index]) {
            variantCopy.imageRefs = variantImages[index].map((_, imgIndex) => 
              `variant_${index+1}`
            );
          }
          return variantCopy;
        });

        formData.append('variants', JSON.stringify(processedVariants));

        // Append variant images
        Object.entries(variantImages).forEach(([variantIndex, images]) => {
          images.forEach((image, imageIndex) => {
            if (image instanceof File) {
              formData.append(
                `variant_${Number.parseInt(variantIndex)+1}`,
                image
              );
            }
          });
        });
      }

      // Log formData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      console.log("createProduct reached");
      createProduct(formData, {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Product created successfully",
          });
          // Optional: Reset form or redirect
          // form.reset();
          // navigate('/products');
        },
        onError: (error) => {
          console.error('Product creation error:', error);
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to create product",
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to process form data",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const steps = [
    { id: 'basic', component: <BasicDetails form={form} /> },
    { id: 'categorization', component: <Categorization form={form} /> },
    { id: 'specifications', component: <Specifications form={form} /> },
    { id: 'audience', component: <TargetAudience form={form} /> },
    { id: 'status', component: <StatusVisibility form={form} /> },
    { id: 'seo', component: <SEO form={form} /> },
    { id: 'baseImage', component: <ImageUpload 
        title="Base Image" 
        description="Upload the main image for your product" 
        images={baseImage} 
        setImages={setBaseImage} 
        multiple={false}
      /> 
    },
    { id: 'variants', component: <Variants form={form} variantImages={variantImages} setVariantImages={
      setVariantImages
    //   (newImages, key) => {
    //   setVariantImages(prev => {
    //     return {
    //       ...prev,
    //       [key]: newImages,
    //     }
    //   })
    // }
    }/> },
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)
  const isLastStep = currentStepIndex === steps.length - 1
  const isFirstStep = currentStepIndex === 0

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(steps[currentStepIndex + 1].id)
    }
  }

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(steps[currentStepIndex - 1].id)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Create New Product</h1>
      <FormNavigation currentStep={currentStep} onStepChange={setCurrentStep} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {steps.find(step => step.id === currentStep)?.component}
          <div className="flex justify-between mt-8">
            {!isFirstStep && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {!isLastStep && (
              <Button type="button" onClick={handleNext} className="ml-auto">
                Next
              </Button>
            )}
            {isLastStep && (
              <Button type="submit" className="ml-auto">
                Create Product
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  )
}

export default ProductCreate
