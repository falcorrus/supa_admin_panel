import React, { useState } from 'react';
import { KeyIcon, TrashIcon } from './Icons';
import { Connection } from '../services/connectionManager';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Button } from '@chakra-ui/react';

interface ConnectionListProps {
  connections: Connection[];
  activeConnection: string | null;
  onSetActive: (name: string) => void;
  onRemove: (id: string) => void;
}

const ConnectionList: React.FC<ConnectionListProps> = ({ connections, activeConnection, onSetActive, onRemove }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);

  const openModal = (id: string) => {
    setConnectionToDelete(id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setConnectionToDelete(null);
    setIsModalOpen(false);
  };

  const confirmRemove = () => {
    if (connectionToDelete) {
      onRemove(connectionToDelete);
    }
    closeModal();
  };

  return (
    <>
      <ul className="space-y-3 w-full">
        {connections.map((connection) => {
          return (
            <li key={connection.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <button
                onClick={() => onSetActive(connection.connection_name)}
                className={`w-full px-4 py-2 rounded-md text-left font-medium transition-colors flex items-center ${
                  activeConnection === connection.connection_name
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-7 flex justify-center mr-2 flex-shrink-0">
                    {connection.encrypted_service_role_key && <KeyIcon className="w-5 h-5 text-yellow-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{connection.connection_name}</p>
                    <p className="text-xs text-gray-400 truncate">{connection.db_url}</p>
                  </div>
                </div>
                
              </button>
              <button
                onClick={() => openModal(connection.id)}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-2 rounded transition-colors self-stretch"
              >
                <TrashIcon className="w-5 h-5"/>
              </button>
            </li>
          );
        })}
      </ul>

      <Modal isOpen={isModalOpen} onClose={closeModal} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Удалить подключение</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>Вы уверены, что хотите удалить это подключение?</p>
          </ModalBody>
          <ModalFooter>
            <Button bg="gray.700" color="white" _hover={{ bg: "gray.600" }} _active={{ bg: "gray.800" }} mr={3} onClick={closeModal}>
              Отмена
            </Button>
            <Button bg="red.600" color="white" _hover={{ bg: "red.500" }} _active={{ bg: "red.700" }} onClick={confirmRemove}>
              Удалить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ConnectionList;