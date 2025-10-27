import React, { useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Table } from '../types';
import { Box, Heading, Text, Button, Card, CardBody, CardHeader, Grid, Switch, useColorMode, useToast, Icon } from '@chakra-ui/react';
import { VisibilityAllIcon, VisibilityNoneIcon, VisibilityMixedIcon } from './Icons';
import { HiSun, HiMoon } from 'react-icons/hi';

interface SettingsProps {
  user: User | null;
  tables: Table[];
  tableVisibility: Record<string, boolean>;
  customTableVisibility: Record<string, boolean> | null;
  visibilityMode: 'all' | 'none' | 'custom';
  toggleTableVisibility: (tableName: string) => void;
  cycleVisibilityMode: () => void;
  tablesFetchMethod: string | null;
}

const SettingsChakra: React.FC<SettingsProps> = ({ user, tables, tableVisibility, customTableVisibility, visibilityMode, toggleTableVisibility, cycleVisibilityMode, tablesFetchMethod }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const visibilityState = useMemo(() => {
    return visibilityMode;
  }, [visibilityMode]);

  const toggleAllVisibility = () => {
    cycleVisibilityMode();
  };

  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();

  const handleLogoutWithToast = () => {
    handleLogout();
    toast({
      title: 'Выход из аккаунта',
      description: 'Вы успешно вышли из системы.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box p={6} maxW="4xl" mx="auto">
      <Heading as="h1" size="xl" mb={6}>Настройки</Heading>
      
      <Card mb={6}>
        <CardHeader>
          <Heading size="lg">Информация</Heading>
        </CardHeader>
        <CardBody>
          <Text>
            <Text as="span" fontWeight="bold" color="emerald.400">Способ получения таблиц:</Text> {tablesFetchMethod || 'Неизвестен'}
          </Text>
          <Text fontSize="sm" mt={2} color="gray.500">
            {tablesFetchMethod === 'Сервисный ключ' 
              ? 'Используется сервисный ключ для прямого доступа к information_schema.' 
              : tablesFetchMethod === 'RPC-функция (get_user_tables)' 
                ? 'Используется RPC-функция get_user_tables для получения списка таблиц.' 
                : 'Не удалось определить способ получения таблиц.'}
          </Text>
          <Button 
            leftIcon={colorMode === 'light' ? <Icon as={HiMoon} /> : <Icon as={HiSun} />}
            onClick={toggleColorMode}
            mt={4}
            _hover={{ bg: colorMode === 'light' ? 'gray.300' : 'gray.600' }}
            transition="all 0.2s ease-in-out"
          >
            Переключить тему
          </Button>
        </CardBody>
      </Card>
      
      <Card mb={6}>
        <CardHeader>
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <Heading size="lg">Видимость таблиц</Heading>
            <Button
              onClick={toggleAllVisibility}
              variant="ghost"
              title={
                visibilityState === 'all' ? 'Скрыть все' : 
                visibilityState === 'none' ? 'Показать все' : 'Скрыть все'
              }
              _hover={{ bg: 'gray.600' }}
              transition="all 0.2s ease-in-out"
            >
              {visibilityState === 'all' ? (
                <VisibilityAllIcon className="w-6 h-6 text-emerald-400" />
              ) : visibilityState === 'none' ? (
                <VisibilityNoneIcon className="w-6 h-6 text-gray-400" />
              ) : (
                <VisibilityMixedIcon className="w-6 h-6 text-white" />
              )}
            </Button>
          </Box>
        </CardHeader>
        <CardBody>
          <Text color="gray.500" mb={4}>Нажмите на таблицу, чтобы скрыть/показать в боковой панели</Text>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={3}>
            {tables.map((table) => (
              <Button
                key={table.table_name}
                onClick={() => toggleTableVisibility(table.table_name)}
                variant={tableVisibility[table.table_name] === false ? "outline" : "solid"}
                colorScheme={tableVisibility[table.table_name] === false ? "gray" : "green"}
                bg={tableVisibility[table.table_name] === false ? "gray.600" : "green.600"}
                _hover={{ 
                  bg: tableVisibility[table.table_name] === false ? "gray.500" : "green.500",
                  transform: "scale(1.05)" 
                }}
                _active={{ 
                  bg: tableVisibility[table.table_name] === false ? "gray.700" : "green.700",
                  transform: "scale(0.98)" 
                }}
                transition="all 0.2s ease-in-out"
              >
                {table.table_name}
              </Button>
            ))}
          </Grid>
        </CardBody>
      </Card>


    </Box>
  );
};

export default SettingsChakra;