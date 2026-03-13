# TechVeo - Plataforma de Extração de Imagens a partir de Vídeos
## 1. Introdução

A TechVeo é uma plataforma orientada ao processamento assíncrono de vídeos, projetada para receber solicitações de usuários autenticados, obter o vídeo correspondente para processamento e realizar a extração de imagens a partir dele.

No fluxo da solução, o vídeo é tratado como fonte de entrada. A partir desse arquivo, o sistema realiza o download do vídeo e executa a geração de snapshots conforme os parâmetros definidos pelo usuário no frontend, especialmente a quantidade de imagens e a qualidade desejada.

O resultado do processamento não é um novo vídeo transformado, mas sim um conjunto de imagens extraídas do vídeo original, geradas de acordo com as preferências informadas pelo usuário.

A arquitetura foi definida com foco em:

escalabilidade

desacoplamento

tolerância a falhas

processamento assíncrono

automação de deploy

facilidade de manutenção

separação clara de responsabilidades

A solução foi organizada em múltiplos repositórios, refletindo uma arquitetura distribuída baseada em serviços especializados, containers, mensageria e infraestrutura como código.

## 2. Objetivo da Solução

O objetivo da plataforma é permitir que usuários autenticados solicitem o processamento de vídeos, definam parâmetros de extração de imagens no frontend, acompanhem o andamento da execução e obtenham o resultado final de forma segura, rastreável e escalável.

No momento da solicitação, o usuário informa critérios como:

quantidade de imagens a serem geradas

qualidade desejada para os snapshots

A partir dessas definições, a plataforma executa o processamento assíncrono, realiza o download do vídeo de origem e extrai imagens dele com base nas preferências selecionadas. O resultado final disponibilizado ao usuário corresponde às imagens geradas a partir do vídeo, e não ao vídeo em si.

A arquitetura atende aos seguintes objetivos técnicos:

suportar múltiplos processamentos simultâneos

desacoplar requisições HTTP do processamento pesado

evitar perda de requisições em cenários de pico

garantir rastreabilidade do status de cada solicitação

permitir evolução independente dos serviços

automatizar build, testes e deploy

## 3. Visão Geral da Arquitetura

A solução adota uma arquitetura distribuída composta pelos seguintes blocos principais:

Frontend Web

Serviço de Autenticação

Serviço de Management / Orquestração

Serviço de Processamento

Serviço de Notificação

Mensageria com RabbitMQ

Banco de dados relacional

Kubernetes para orquestração

Terraform para provisionamento

GitHub Actions para CI/CD

Essa abordagem permite separar o fluxo síncrono da interação do usuário do fluxo assíncrono de processamento, aumentando a resiliência da solução e permitindo escalar os componentes de forma independente.

O fluxo central da plataforma consiste em registrar a solicitação do usuário, enfileirar o processamento, realizar o download do vídeo de origem e extrair imagens a partir dele. Dessa forma, a TechVeo é uma solução voltada à geração de snapshots, e não ao processamento do vídeo como artefato final.

## 4. Estrutura de Repositórios

A solução está organizada em múltiplos repositórios, cada um com responsabilidade específica.

## 4.1 techveo-web

Repositório responsável pela aplicação web.

Responsabilidades:

interface do usuário

login

envio da solicitação de processamento

definição dos parâmetros de geração de snapshots

seleção da quantidade de imagens desejadas

seleção da qualidade das imagens

acompanhamento de status

consulta do resultado final

## 4.2 techveo-management

Repositório responsável pela API principal e camada de orquestração do sistema.

Responsabilidades:

receber requisições do frontend

validar dados de entrada

registrar solicitações no banco

persistir os parâmetros escolhidos pelo usuário

publicar eventos no RabbitMQ

consultar status dos processamentos

centralizar a lógica de gestão do fluxo

## 4.3 techveo-processing

Repositório responsável pelo processamento assíncrono.

Responsabilidades:

consumir mensagens do RabbitMQ

obter e realizar o download do vídeo a ser processado

executar a extração de imagens a partir do vídeo

gerar snapshots conforme quantidade e qualidade informadas pelo usuário

atualizar status no banco

publicar eventos de erro ou conclusão

## 4.4 techveo-authentication

Repositório responsável pela autenticação e autorização.

Responsabilidades:

validar credenciais

gerar token JWT

controlar acesso aos recursos

garantir segregação por usuário

## 4.5 techveo-notification

Repositório responsável pela camada de comunicação e notificação.

Responsabilidades:

receber eventos relevantes

notificar usuários sobre falhas ou conclusão do processamento

registrar histórico de notificações

## 4.6 techveo-shared

Biblioteca compartilhada entre serviços.

Responsabilidades:

DTOs

contratos

eventos

modelos comuns

enums

utilitários compartilhados

O techveo-shared não representa um serviço executando em runtime, mas uma biblioteca comum utilizada pelos demais componentes para padronização dos contratos e reaproveitamento de código.

## 4.7 techveo-k8s

Repositório responsável pelos manifests Kubernetes.

Responsabilidades:

deployments

services

ingress

configmaps

secrets

autoscaling

## 4.8 techveo-terraform

Repositório responsável pelo provisionamento da infraestrutura geral.

Responsabilidades:

provisionamento de recursos de ambiente

rede

componentes compartilhados de infraestrutura

preparação do ambiente para execução dos serviços

## 4.9 techveo-db-terraform

Repositório responsável pelo provisionamento da infraestrutura do banco de dados.

Responsabilidades:

criação do banco

configurações de persistência

acesso

parâmetros operacionais do banco

## 5. Tecnologias Utilizadas
| Categoria | Tecnologia |
| :--- | :--- |
| **Frontend** | TypeScript |
| **Backend / APIs** | C# / .NET |
| **Containers** | Docker |
| **Orquestração** | Kubernetes |
| **Mensageria** | RabbitMQ |
| **Banco de Dados** | SQL Server |
| **IaC** | Terraform |
| **CI/CD** | GitHub Actions |
| **Autenticação** | JWT |
| **Compartilhamento de contratos** |	Biblioteca shared |
| **Monitoramento** |	Jagger e Grafana |

## 6. Diagrama de Componentes
  <img width="677" height="655" alt="Diagrama de Componentes" src="/docs/diagrama-de-componentes.jpg" />

## 6.1 Diagrama de Sequência
  <img width="1200" alt="Diagrama de Sequência" src="/docs/diagrama-de-sequencia.jpg" />

## 7. Explicação do Fluxo Arquitetural

A arquitetura possui dois fluxos complementares: o fluxo funcional da aplicação e o fluxo de infraestrutura e execução.

## 7.1 Fluxo funcional da aplicação

O usuário acessa a aplicação por meio do techveo-web.

O frontend solicita autenticação ao techveo-authentication.

Após a validação das credenciais, o usuário recebe autorização para utilizar a plataforma.

No frontend, o usuário informa os parâmetros de processamento, incluindo a quantidade de snapshots e a qualidade das imagens desejadas.

O frontend envia essas informações ao techveo-management.

O techveo-management registra os dados da solicitação no banco relacional, incluindo os parâmetros escolhidos pelo usuário.

Em seguida, o techveo-management publica uma mensagem no RabbitMQ contendo as informações necessárias para o processamento.

O techveo-processing consome a mensagem da fila.

O serviço de processamento realiza o download do vídeo de origem.

Após obter o vídeo, o serviço executa a extração das imagens de acordo com a quantidade e a qualidade selecionadas pelo usuário.

O serviço atualiza o status da execução no banco.

Em caso de erro ou evento relevante, o techveo-processing aciona o techveo-notification.

O techveo-notification registra e envia a notificação correspondente.

O usuário consulta o andamento pelo frontend, que recupera as informações via techveo-management.

##  7.2 Fluxo de infraestrutura e deploy

O techveo-terraform provisiona a infraestrutura base do ambiente.

O techveo-db-terraform provisiona a infraestrutura do banco de dados.

O techveo-k8s contém os manifests responsáveis por subir os serviços no cluster.

Cada serviço é executado em container e gerenciado pelo Kubernetes.

O deploy dos serviços é automatizado por pipeline com GitHub Actions.

## 8.0 Fluxo Operacional do Processamento
## 8.1 Solicitação e parametrização

Quando o usuário solicita o processamento, o frontend encaminha os parâmetros definidos na interface, especialmente a quantidade de snapshots e a qualidade desejada para as imagens. O serviço de management recebe essas informações, valida os dados, registra a solicitação no banco e publica uma mensagem na fila do RabbitMQ.

## 8.2 Download do vídeo

O serviço de processing consome a mensagem da fila e executa o processamento de forma desacoplada da requisição original. Como parte desse fluxo, ele realiza o download do vídeo que será usado como fonte de entrada.

## 8.3 Extração das imagens

Após obter o vídeo, o serviço executa a extração de imagens a partir dele. A geração dos snapshots ocorre com base na quantidade solicitada pelo usuário e na qualidade configurada no frontend.

## 8.4 Resultado do processamento

O principal resultado da execução é o conjunto de imagens extraídas do vídeo, representando os snapshots gerados. Dessa forma, o sistema não transforma ou devolve o vídeo como artefato principal, mas sim as imagens produzidas a partir dele.

## 8.5 Atualização de status

Durante a execução, os dados da solicitação podem passar por estados como:

RECEBIDO

EM_FILA

PROCESSANDO

CONCLUIDO

ERRO

Esses estados ficam persistidos no banco e podem ser consultados pelo frontend.

## 8.6 Notificação

Quando ocorre uma falha ou evento importante, o serviço de notification é acionado para registrar e disparar a comunicação correspondente ao usuário.

## 9. Justificativa das Decisões Arquiteturais
### 9.1 Separação por múltiplos repositórios

A divisão por repositório reduz acoplamento, melhora a manutenibilidade e permite evolução independente dos componentes.

### 9.2 Uso de mensageria com RabbitMQ

O RabbitMQ foi adotado para desacoplar o recebimento da solicitação do processamento pesado, garantindo maior resiliência e melhor absorção de picos de carga.

### 9.3 Uso de Kubernetes

O Kubernetes foi escolhido para orquestrar os containers, facilitar escalabilidade horizontal, alta disponibilidade e padronização de deploy.

### 9.4 Uso de banco relacional

A persistência relacional atende bem ao cenário de usuários, requisições, status, histórico operacional e notificações.

### 9.5 Uso de biblioteca compartilhada

A existência do techveo-shared ajuda a manter consistência entre contratos, eventos e modelos utilizados pelos serviços.

### 9.6 Infraestrutura como código

Terraform garante rastreabilidade, repetibilidade e padronização do provisionamento do ambiente.

## 10. Escalabilidade

A arquitetura foi desenhada para escalar horizontalmente os componentes mais críticos.

Estratégias adotadas

containers independentes por serviço

processamento desacoplado via fila

orquestração com Kubernetes

possibilidade de múltiplas réplicas do serviço de processamento

separação entre fluxo síncrono e fluxo assíncrono

Benefícios

melhor aproveitamento de recursos

aumento de throughput em momentos de pico

menor risco de indisponibilidade

crescimento independente por componente

## 11. Resiliência e Confiabilidade

A solução considera práticas para tornar o sistema mais robusto:

filas para desacoplamento

persistência de estados

reprocessamento controlado

independência entre serviços

possibilidade de retry

registro de falhas

notificação em caso de erro

A mensageria reduz a chance de perda de requisições, principalmente em cenários de maior volume de solicitações.

## 12. Segurança

A segurança da solução é tratada nos seguintes pontos:

autenticação por usuário e senha

emissão de token JWT

segregação de acesso por usuário

controle de autenticação nas APIs

uso de secrets no Kubernetes

centralização das credenciais por ambiente

proteção do acesso aos serviços internos

## 13. Observabilidade e Operação

Para operação adequada da plataforma, recomenda-se incluir:

logs estruturados por serviço

correlation id para rastreamento

health checks

monitoramento das filas

monitoramento do tempo de processamento

alertas operacionais para falhas críticas

Esses itens aumentam a capacidade de diagnóstico e sustentação do ambiente em produção.

## 14. Estratégia de Deploy

A aplicação é empacotada em imagens Docker e executada em Kubernetes.

### Componentes implantados

- frontend web
- autenticação
- management
- processing
- notification

### Recursos esperados em Kubernetes

- Deployment
- Service
- Ingress
- ConfigMap
- Secret
- HPA

Essa estrutura permite padronização do ciclo de vida dos serviços e maior previsibilidade na operação.

## 15. Estratégia de CI/CD

A solução utiliza GitHub Actions como mecanismo de integração e entrega contínua.

Fluxo esperado da pipeline

disparo por push ou pull request

restore de dependências

build da aplicação

execução de testes automatizados

build das imagens Docker

publicação das imagens

deploy no ambiente Kubernetes

Benefícios

automação da validação do código

redução de erros manuais

entregas mais rápidas

padronização do processo de publicação

## 16. Modelo Conceitual de Dados



## 17. Vantagens da Arquitetura Proposta

A arquitetura oferece os seguintes ganhos:

desacoplamento entre componentes

melhor manutenção

facilidade de escalabilidade

separação clara de responsabilidades

automação de infraestrutura e deploy

maior tolerância a falhas

melhor aderência a práticas modernas de DevOps

## 18. Riscos e Pontos de Atenção

Mesmo com uma arquitetura sólida, alguns cuidados devem ser considerados:

crescimento do volume de mensagens na fila

consumo intensivo de CPU e memória pelo processamento

necessidade de rastreabilidade entre serviços

governança de contratos compartilhados

versionamento coordenado entre serviços

controle de credenciais e segredos

Esses riscos podem ser mitigados com monitoramento, observabilidade, governança de APIs e políticas adequadas de operação.

## 19. Conclusão

A arquitetura da TechVeo foi estruturada para suportar um cenário de processamento distribuído com foco na extração assíncrona de imagens a partir de vídeos.

A separação em múltiplos repositórios, aliada ao uso de Docker, Kubernetes, RabbitMQ, SQL Server, Terraform e GitHub Actions, permite que a solução seja modular, resiliente e aderente às boas práticas de engenharia de software e operação em ambientes modernos.

Essa abordagem sustenta tanto a necessidade atual do projeto quanto sua evolução futura, mantendo clareza arquitetural, independência entre componentes e capacidade de crescimento.

## 20. Resumo Executivo

A TechVeo utiliza uma arquitetura distribuída composta por frontend, autenticação, management, processamento, notificação, mensageria e infraestrutura automatizada. O fluxo principal começa no frontend, passa pela autenticação e segue para o serviço de management, que registra a solicitação no banco e publica uma mensagem no RabbitMQ. O serviço de processing consome essa mensagem, realiza o download do vídeo de origem e executa a extração assíncrona de imagens com base na quantidade e qualidade definidas pelo usuário. O status da operação é atualizado ao longo do fluxo, e o serviço de notification é acionado quando necessário. Toda a solução roda em containers orquestrados por Kubernetes, com provisionamento via Terraform e pipeline automatizada com GitHub Actions.
