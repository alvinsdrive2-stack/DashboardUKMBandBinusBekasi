'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Switch,
  Checkbox,
  RadioGroup,
  Radio,
  SimpleGrid,
  Card,
  CardBody,
  Heading,
  Divider,
  useBreakpointValue,
  Stack,
} from '@chakra-ui/react';

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'switch' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  description?: string;
  cols?: number;
  rows?: number;
}

interface ManagerResponsiveFormProps {
  fields: FieldConfig[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  submitText?: string;
  title?: string;
  subtitle?: string;
  errors?: Record<string, string>;
  disabled?: boolean;
  onReset?: () => void;
}

export default function ManagerResponsiveForm({
  fields,
  values,
  onChange,
  onSubmit,
  isLoading = false,
  submitText = "Simpan",
  title,
  subtitle,
  errors = {},
  disabled = false,
  onReset,
}: ManagerResponsiveFormProps) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const renderField = (field: FieldConfig) => {
    const hasError = errors[field.name];
    const fieldCols = isMobile ? 1 : (field.cols || 1);

    const commonProps = {
      id: field.name,
      name: field.name,
      value: values[field.name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(field.name, e.target.value);
      },
      isInvalid: !!hasError,
      isDisabled: disabled,
    };

    switch (field.type) {
      case 'textarea':
        return (
          <FormControl
            key={field.name}
            isRequired={field.required}
            isInvalid={!!hasError}
            gridColumn={fieldCols}
          >
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>
              {field.label}
              {field.required && (
                <Text as="span" color="red.500" ml={1}>
                  *
                </Text>
              )}
            </FormLabel>
            <Textarea
              {...commonProps}
              placeholder={field.placeholder}
              rows={field.rows || 4}
              resize="vertical"
              size={{ base: 'sm', md: 'md' }}
            />
            {field.description && (
              <Text fontSize="xs" color="#718096" mt={1} fontStyle="italic">
                ℹ {field.description}
              </Text>
            )}
            <FormErrorMessage>{hasError}</FormErrorMessage>
          </FormControl>
        );

      case 'number':
        return (
          <FormControl
            key={field.name}
            isRequired={field.required}
            isInvalid={!!hasError}
            gridColumn={fieldCols}
          >
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>
              {field.label}
              {field.required && (
                <Text as="span" color="red.500" ml={1}>
                  *
                </Text>
              )}
            </FormLabel>
            <NumberInput size={{ base: 'sm', md: 'md' }}>
              <NumberInputField
                {...commonProps}
                placeholder={field.placeholder}
                min={field.validation?.min}
                max={field.validation?.max}
                onChange={(value) => onChange(field.name, value)}
              />
              <NumberInputStepper />
            </NumberInput>
            {field.description && (
              <Text fontSize="xs" color="#718096" mt={1} fontStyle="italic">
                ℹ {field.description}
              </Text>
            )}
            <FormErrorMessage>{hasError}</FormErrorMessage>
          </FormControl>
        );

      case 'select':
        return (
          <FormControl
            key={field.name}
            isRequired={field.required}
            isInvalid={!!hasError}
            gridColumn={fieldCols}
          >
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>
              {field.label}
              {field.required && (
                <Text as="span" color="red.500" ml={1}>
                  *
                </Text>
              )}
            </FormLabel>
            <Select
              placeholder={field.placeholder}
              size={{ base: 'sm', md: 'md' }}
              value={values[field.name] || ''}
              onChange={(e) => onChange(field.name, e.target.value)}
              isDisabled={disabled}
            >
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {field.description && (
              <Text fontSize="xs" color="#718096" mt={1} fontStyle="italic">
                ℹ {field.description}
              </Text>
            )}
            <FormErrorMessage>{hasError}</FormErrorMessage>
          </FormControl>
        );

      case 'switch':
        return (
          <FormControl
            key={field.name}
            gridColumn={fieldCols}
            display="flex"
            alignItems="center"
          >
            <FormLabel mb="0" fontSize={{ base: 'sm', md: 'md' }}>
              {field.label}
            </FormLabel>
            <Switch
              isChecked={values[field.name] || false}
              onChange={(e) => onChange(field.name, e.target.checked)}
              isDisabled={disabled}
              size={{ base: 'sm', md: 'md' }}
            />
            {field.description && (
              <Text fontSize="xs" color="#718096" mt={1} fontStyle="italic">
                ℹ {field.description}
              </Text>
            )}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControl
            key={field.name}
            isRequired={field.required}
            gridColumn={fieldCols}
          >
            <Checkbox
              isChecked={values[field.name] || false}
              onChange={(e) => onChange(field.name, e.target.checked)}
              isDisabled={disabled}
              size={{ base: 'sm', md: 'md' }}
            >
              {field.label}
            </Checkbox>
            {field.description && (
              <Text fontSize="xs" color="#718096" mt={1} fontStyle="italic">
                ℹ {field.description}
              </Text>
            )}
            <FormErrorMessage>{hasError}</FormErrorMessage>
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl
            key={field.name}
            isRequired={field.required}
            isInvalid={!!hasError}
            gridColumn={fieldCols}
          >
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>
              {field.label}
              {field.required && (
                <Text as="span" color="red.500" ml={1}>
                  *
                </Text>
              )}
            </FormLabel>
            <RadioGroup
              value={values[field.name]}
              onChange={(value) => onChange(field.name, value)}
              isDisabled={disabled}
            >
              <VStack align="start" spacing={2}>
                {field.options?.map((option) => (
                  <Radio
                    key={option.value}
                    value={option.value}
                    size={{ base: 'sm', md: 'md' }}
                  >
                    {option.label}
                  </Radio>
                ))}
              </VStack>
            </RadioGroup>
            {field.description && (
              <Text fontSize="xs" color="#718096" mt={1} fontStyle="italic">
                ℹ {field.description}
              </Text>
            )}
            <FormErrorMessage>{hasError}</FormErrorMessage>
          </FormControl>
        );

      default:
        return (
          <FormControl
            key={field.name}
            isRequired={field.required}
            isInvalid={!!hasError}
            gridColumn={fieldCols}
          >
            <FormLabel fontSize={{ base: 'sm', md: 'md' }}>
              {field.label}
              {field.required && (
                <Text as="span" color="red.500" ml={1}>
                  *
                </Text>
              )}
            </FormLabel>
            <Input
              {...commonProps}
              placeholder={field.placeholder}
              type="text"
              size={{ base: 'sm', md: 'md' }}
            />
            {field.description && (
              <Text fontSize="xs" color="#718096" mt={1} fontStyle="italic">
                ℹ {field.description}
              </Text>
            )}
            <FormErrorMessage>{hasError}</FormErrorMessage>
          </FormControl>
        );
    }
  };

  return (
    <Box w="full">
      <Card
        variant="outline"
        borderRadius="lg"
        shadow="sm"
        overflow="hidden"
      >
        {(title || subtitle) && (
          <CardBody
            bg="#f8fafc"
            borderBottom="1px solid"
            borderColor="#e2e8f0"
            p={{ base: 4, md: 6 }}
          >
            <VStack spacing={1} align="flex-start">
              {title && (
                <Heading
                  size={{ base: 'md', md: 'lg' }}
                  color="#1a202c"
                  fontWeight="600"
                >
                  {title}
                </Heading>
              )}
              {subtitle && (
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color="#718096"
                >
                  {subtitle}
                </Text>
              )}
            </VStack>
          </CardBody>
        )}

        <CardBody p={{ base: 4, md: 6 }}>
          <form onSubmit={onSubmit}>
            <VStack spacing={4} align="stretch">
              <SimpleGrid
                columns={{ base: 1, md: isMobile ? 1 : 2 }}
                spacing={4}
              >
                {fields.map(renderField)}
              </SimpleGrid>

              <Divider />

              <Stack
                direction={{ base: 'column', md: 'row' }}
                spacing={3}
                justify="flex-end"
              >
                {onReset && (
                  <Button
                    variant="outline"
                    onClick={onReset}
                    disabled={disabled}
                    size={{ base: 'sm', md: 'md' }}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Reset
                  </Button>
                )}
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={isLoading}
                  disabled={disabled}
                  size={{ base: 'sm', md: 'md' }}
                  w={{ base: 'full', md: 'auto' }}
                >
                  {submitText}
                </Button>
              </Stack>
            </VStack>
          </form>
        </CardBody>
      </Card>
    </Box>
  );
}